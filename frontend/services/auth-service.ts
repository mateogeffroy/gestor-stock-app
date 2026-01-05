import { supabase } from "@/lib/supabase";

export const authService = {
  // 2. Actualizar contraseña (sirve tanto para recuperación como para cambio voluntario)
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return data;
  },

  // 3. Cerrar sesión (útil para probar)
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};