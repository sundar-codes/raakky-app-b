interface Env {
  DB: any;
  BUCKET?: any;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
}

export const onRequest: any = async (context: { request: Request; env: Env; params: any }) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (path === '/shop/settings' && method === 'GET') {
      if (env.DB) {
        const stmt = env.DB.prepare('SELECT * FROM shop_settings WHERE id = 1');
        const data = await stmt.first();
        if (data) {
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        }
      }
      return new Response(JSON.stringify({ status: 'default' }), { headers: corsHeaders });
    }

    if (path === '/categories' && method === 'GET') {
      if (env.DB) {
        const { results } = await env.DB.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }
    }

    if (path === '/products' && method === 'GET') {
      if (env.DB) {
        const category = url.searchParams.get('category');
        let query = 'SELECT * FROM products WHERE is_available = 1';
        const params: any[] = [];
        if (category) {
          query += ' AND category_id = ?';
          params.push(category);
        }
        query += ' ORDER BY display_order ASC';
        const { results: products } = await env.DB.prepare(query).bind(...params).all();

        for (const product of products) {
          const { results: variants } = await env.DB.prepare(
            'SELECT * FROM product_variants WHERE product_id = ?'
          ).bind(product.id).all();
          product.variants = variants;
        }

        return new Response(JSON.stringify(products), { headers: corsHeaders });
      }
    }

    if (path === '/orders' && method === 'POST') {
      return new Response(JSON.stringify({ success: true, orderId: `ord_${Date.now()}` }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ message: 'Raakky Chicken API endpoint ready' }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
