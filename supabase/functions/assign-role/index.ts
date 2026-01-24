import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Step 1: Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Failed to verify token:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerUserId = claimsData.claims.sub;
    console.log("Authenticated user:", callerUserId);

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Step 2: Check if caller is a principal (only principals can assign roles)
    const { data: callerRoles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId);

    if (roleError) {
      console.error("Error fetching caller roles:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify caller permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isPrincipal = callerRoles?.some(r => r.role === "principal");
    
    if (!isPrincipal) {
      console.error("Unauthorized role assignment attempt by user:", callerUserId);
      return new Response(
        JSON.stringify({ error: "Forbidden: Only principals can assign roles" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Parse and validate request body
    const { user_id, role, department_id } = await req.json();

    if (!user_id || !role) {
      return new Response(
        JSON.stringify({ error: "user_id and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role
    const validRoles = ["teacher", "hod", "principal"];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be teacher, hod, or principal" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Principal", callerUserId, "assigning role", role, "to user", user_id);

    // Step 4: Insert the role
    const { error: insertRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id, role });

    if (insertRoleError) {
      console.error("Error inserting role:", insertRoleError);
      return new Response(
        JSON.stringify({ error: insertRoleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If teacher and department_id provided, assign to department
    if (role === "teacher" && department_id) {
      const { error: assignError } = await supabaseAdmin
        .from("teacher_assignments")
        .insert({ teacher_user_id: user_id, department_id });

      if (assignError) {
        console.error("Error assigning teacher to department:", assignError);
        // Don't fail the whole operation, just log
      }
    }

    // If HOD and department_id provided, update department
    if (role === "hod" && department_id) {
      const { error: deptError } = await supabaseAdmin
        .from("departments")
        .update({ hod_user_id: user_id })
        .eq("id", department_id);

      if (deptError) {
        console.error("Error assigning HOD to department:", deptError);
      }
    }

    console.log("Role assignment successful:", { user_id, role, assigned_by: callerUserId });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in assign-role function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
