/**
 * supportService.js
 *
 * 고객센터 문의 저장 (support_inquiries 테이블).
 */

import { supabase } from "../lib/supabase.js";

/**
 * 문의를 저장합니다.
 *
 * @param {{
 *   userId?:   string | null,
 *   email:     string,
 *   category:  string,
 *   subject:   string,
 *   message:   string,
 * }} data
 * @returns {Promise<{ error: Error|null }>}
 */
export async function submitInquiry({ userId = null, email, category, subject, message }) {
  const { error } = await supabase
    .from("support_inquiries")
    .insert({
      user_id:  userId  ?? null,
      email:    email.trim(),
      category,
      subject:  subject.trim(),
      message:  message.trim(),
    });
  return { error: error ?? null };
}
