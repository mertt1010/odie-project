import supabase from "../supabase/SupabaseClient";

const AuthService = {
  /**
   * Sign up a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Supabase response
   */
  signUp: async (email, password) => {
    return await supabase.auth.signUp({
      email,
      password,
    });
  },

  /**
   * Sign in a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Supabase response
   */
  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  /**
   * Sign out the current user
   * @returns {Promise} - Supabase response
   */
  signOut: async () => {
    return await supabase.auth.signOut();
  },

  /**
   * Get the current user session
   * @returns {Promise} - Supabase response with session data
   */
  getSession: async () => {
    return await supabase.auth.getSession();
  },
};

export default AuthService;
