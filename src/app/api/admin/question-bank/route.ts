/**
 * GET  /api/admin/question-bank?franchise=Pokemon
 * POST /api/admin/question-bank
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const franchise = url.searchParams.get('franchise');
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('question_bank')
      .select('*, quiz_card:quiz_card_id(card_name, grade, price, image_url), custom_card:custom_card_id(card_name, price, image_url)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (franchise) query = query.eq('franchise', franchise);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('question_bank')
      .insert(body)
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
