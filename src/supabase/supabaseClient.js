import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_API_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export const signIn = async (email, password) => {
  if (email === "" || password === "") {
    return { error: "Invalid data" };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Error signing in:", error.message);
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
};

// supabase.auth.onAuthStateChange((event, session) => {
//   console.log("Auth event:", event, "Session:", session);
// });