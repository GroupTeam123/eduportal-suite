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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    // Insert the role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id, role });

    if (roleError) {
      console.error("Error inserting role:", roleError);
      return new Response(
        JSON.stringify({ error: roleError.message }),
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
