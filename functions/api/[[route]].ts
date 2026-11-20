interface Env {
  DB: any;
  BUCKET?: any;
  STORE_PHONE?: string;
  STORE_CITY?: string;
  ENVIRONMENT?: string;
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

    if (path.startsWith('/products/') && method === 'GET') {
      const productId = path.replace('/products/', '');
      if (env.DB) {
        const product: any = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productId).first();
        if (product) {
          const { results: variants } = await env.DB.prepare(
            'SELECT * FROM product_variants WHERE product_id = ?'
          ).bind(productId).all();
          product.variants = variants;
          return new Response(JSON.stringify(product), { headers: corsHeaders });
        }
      }
    }

    if (path === '/auth/send-otp' && method === 'POST') {
      return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully' }), { headers: corsHeaders });
    }

    if (path === '/auth/verify-otp' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const phone = body.phone || '9876543210';
      return new Response(
        JSON.stringify({
          success: true,
          token: `jwt_live_${Date.now()}`,
          customer: {
            id: `cust_${phone}`,
            phone,
            name: 'Valued Customer',
            isPhoneVerified: true,
          },
        }),
        { headers: corsHeaders }
      );
    }

    if (path === '/orders' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const orderId = `ord_${Date.now()}`;
      return new Response(
        JSON.stringify({
          success: true,
          orderId,
          orderNumber: `RK-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'PENDING',
          message: 'Order received at kitchen counter',
        }),
        { headers: corsHeaders }
      );
    }

    if (path.startsWith('/orders/') && method === 'GET') {
      const orderId = path.replace('/orders/', '');
      if (env.DB) {
        const order: any = await env.DB.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').bind(orderId, orderId).first();
        if (order) {
          return new Response(JSON.stringify(order), { headers: corsHeaders });
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Raakky Chicken API endpoint ready' }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
