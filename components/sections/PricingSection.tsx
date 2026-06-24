import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, onAuthStateChanged } from '../../lib/firebase';
import type { User } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

const PricingSection: React.FC = () => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (planName: string, priceStr: string) => {
    if (!user) {
      toast.error("You need to log in or sign up before completing a transaction.");
      navigate('/login');
      return;
    }

    if (planName === 'Starter' || planName === 'Institutional') {
      window.location.href = "mailto:info@edualttech.com";
      return;
    }

    setProcessingPlan(planName);

    try {
      const amountInPaise = 1250 * 100;

      const resOrder = await fetch('/api/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInPaise })
      });
      const orderData = await resOrder.json();

      if (!resOrder.ok) {
        throw new Error(orderData.error || "Failed to create order on server");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Razorpay payment gateway failed to load. Please check your internet connection.");
        setProcessingPlan(null);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_T2D67OLLpfRjtJ", 
        amount: amountInPaise,
        currency: "INR",
        name: "Edu Alt Tech",
        description: `Subscription for ${planName}`,
        image: "/edulogo.png",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const resVerify = await fetch('/api/verifyPayment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await resVerify.json();

            if (resVerify.ok && verifyData.success) {
              toast.success(`Payment Verified Successfully! Received securely and confirmed.`);
            } else {
              throw new Error(verifyData.error || "Invalid Security Signature");
            }
          } catch (verifyError) {
            console.error("Verification failed:", verifyError);
            toast.error("Payment processed, but security verification failed! Please contact support.");
          }
        },
        prefill: {
          name: user.displayName || "Student Name", 
          email: user.email || "student@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#2a7a3a"
        }
      };

      const paymentObject = new (window as any).Razorpay(options);

      paymentObject.on('payment.failed', function (response: any) {
        toast.error(`Payment Failed. Reason: ${response.error.description}`);
      });

      paymentObject.open();

    } catch (error: any) {
      console.error("Payment initiation failed:", error);
      toast.error(`Payment Failed: ${error.message}`);
    } finally {
      setProcessingPlan(null);
    }
  };

  const faqs = [
    {
      q: 'How does the translation sync work?',
      a: 'Our platform records live transcripts, translates content via AI, and syncs translations directly with chat queues.'
    },
    {
      q: 'Are mobile apps included in the free tier?',
      a: 'Yes, the mobile app is available for free, but live AI features require a Standard subscription.'
    }
  ];

  return (
    <section className="viewport-content">
      <div className="section-header">
        <h2>Pricing</h2>
      </div>

      <div className="grid-3 mb-16" style={{ alignItems: 'stretch' }}>
        {/* Starter Plan */}
        <div className="bento-card">
          <h3 style={{ fontSize: '1rem' }}>Starter</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '12px 0' }}>Free</div>
          <p className="text-sm text-ink-soft mb-6">For individual learners</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="text-sm">
            <li style={{ marginBottom: 8 }}>→ Online catalog access</li>
            <li style={{ marginBottom: 8 }}>→ Public resources</li>
          </ul>
        </div>

        {/* Standard Plan */}
        <div className="bento-card bento-card-featured">
          <h3 className="text-accent" style={{ fontSize: '1rem' }}>Standard</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '12px 0' }}>
            $15 <span style={{ fontSize: '1rem', color: 'var(--ink-mute)', fontWeight: 400 }}>/mo</span>
          </div>
          <p className="text-sm text-ink-soft mb-6">For active learners</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }} className="text-sm">
            <li style={{ marginBottom: 8 }}>→ Live translation</li>
            <li style={{ marginBottom: 8 }}>→ AI learning assistant</li>
            <li style={{ marginBottom: 8 }}>→ Interactive labs</li>
          </ul>
          <button
            className="btn btn-primary btn-full"
            onClick={() => handlePayment('Standard', '$15')}
            disabled={processingPlan === 'Standard'}
          >
            {processingPlan === 'Standard' ? 'Connecting...' : 'Get Started'}
          </button>
        </div>

        {/* Institutional Plan */}
        <div className="bento-card">
          <h3 style={{ fontSize: '1rem' }}>Institutional</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '12px 0' }}>Custom</div>
          <p className="text-sm text-ink-soft mb-6">For schools and colleges</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="text-sm">
            <li style={{ marginBottom: 8 }}>→ Dedicated school ERP</li>
            <li style={{ marginBottom: 8 }}>→ Custom domain</li>
            <li style={{ marginBottom: 8 }}>→ Analytics dashboard</li>
          </ul>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h3 className="mb-6 text-center">Frequently Asked Questions</h3>

        {faqs.map((faq, index) => {
          const isOpen = activeFaq === index;
          return (
            <div key={index} className={`accordion-item ${isOpen ? 'active' : ''}`}>
              <button
                className="accordion-trigger"
                onClick={() => setActiveFaq(isOpen ? null : index)}
              >
                <span>{faq.q}</span>
                <span>{isOpen ? '↑' : '↓'}</span>
              </button>
              <div className="accordion-content">
                {faq.a}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
 const [processingPlan, setProcessingPlan] = useState<string | null>(null);
 const [user, setUser] = useState<User | null>(null);
 const navigate = useNavigate();

 useEffect(() => {
 const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
 setUser(currentUser);
 });
 return () => unsubscribe();
 }, []);

 const loadRazorpayScript = () => {
 return new Promise((resolve) => {
 const script = document.createElement("script");
 script.src = "https://checkout.razorpay.com/v1/checkout.js";
 script.onload = () => resolve(true);
 script.onerror = () => resolve(false);
 document.body.appendChild(script);
 });
 };

 const handlePayment = async (plan: any) => {
 // If the user isn't logged in, redirect them to the login page
 if (!user) {
 toast.error("You need to log in or sign up before completing a transaction.");
 navigate('/login');
 return;
 }

 // If it's a free or custom plan, redirect to email
 if (plan.price === 'Free' || plan.price === 'Custom') {
 window.location.href = "mailto:info@edualttech.com";
 return;
 }

 setProcessingPlan(plan.name);

 try {
 const amountStr = plan.price.replace(/[^0-9]/g, '');
 const amountInPaise = parseInt(amountStr, 10) * 100;

 // 1. Ask Vercel Backend API to securely create an Order using a native REST endpoint (no CORS)
 const resOrder = await fetch('/api/createOrder', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ amount: amountInPaise })
 });
 const orderData = await resOrder.json();

 if (!resOrder.ok) {
 throw new Error(orderData.error || "Failed to create order on server");
 }

 // 2. Load the checkout script
 const scriptLoaded = await loadRazorpayScript();
 if (!scriptLoaded) {
 toast.error("Razorpay payment gateway failed to load. Please check your internet connection.");
 setProcessingPlan(null);
 return;
 }

 // 3. Open checkout with secure Order ID
 const options = {
 key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_T4jaXd9nkSffIH", 
 amount: amountInPaise,
 currency: "INR",
 name: "Edu Alt Tech",
 description: `Subscription for ${plan.name}`,
 image: "/edulogo.png",
 order_id: orderData.id, // Pulled securely from Vercel backend
 handler: async function (response: any) {
 try {
 // 4. Send signatures to Vercel backend for mathematical verification
 const resVerify = await fetch('/api/verifyPayment', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 razorpay_order_id: response.razorpay_order_id,
 razorpay_payment_id: response.razorpay_payment_id,
 razorpay_signature: response.razorpay_signature
 })
 });
 const verifyData = await resVerify.json();

 if (resVerify.ok && verifyData.success) {
 toast.success(`Payment Verified Successfully! Received securely and confirmed.`);
 } else {
 throw new Error(verifyData.error || "Invalid Security Signature");
 }
 } catch (verifyError) {
 console.error("Verification failed:", verifyError);
 toast.error("Payment processed, but security verification failed! Please contact support.");
 }
 },
 prefill: {
 name: "Student Name", 
 email: "student@example.com",
 contact: "9999999999"
 },
 theme: {
 color: "#10b981" // Emerald-500 to match UI
 }
 };

 const paymentObject = new (window as any).Razorpay(options);
 
 paymentObject.on('payment.failed', function (response: any) {
 toast.error(`Payment Failed. Reason: ${response.error.description}`);
 });

 paymentObject.open();

 } catch (error: any) {
 console.error("Payment initiation failed:", error);
 toast.error(`Payment Failed: ${error.message}`);
 } finally {
 setProcessingPlan(null);
 }
 };

 return (
 <section className="py-24 md:py-40 bg-slate-50 [#020617] transition-colors duration-300 relative overflow-hidden">
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4xKSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
 <div className="max-w-[1400px] mx-auto px-6 relative z-10">
 <motion.div
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.8 }}
 className="text-center max-w-2xl mx-auto mb-20"
 >
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold uppercase tracking-widest text-xs mb-8 shadow-sm">
 Transparent Pricing
 </div>
 <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.95]">
 Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Scalable</span> Plans
 </h2>
 <p className="text-xl text-slate-600 font-medium leading-relaxed">
 Choose the plan that best fits your institution. No hidden fees, no surprises.
 </p>
 </motion.div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
 {plans.map((plan, idx) => (
 <motion.div
 key={idx}
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6, delay: idx * 0.1 }}
 className={`relative rounded-[2.5rem] p-10 flex flex-col overflow-hidden group ${
 plan.popular
 ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 /10'
 : 'bg-white /60 backdrop-blur border border-slate-200/50 /50 shadow-xl'
 }`}
 >
 {plan.popular && (
 <>
 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 pointer-events-none" />
 <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
 Most Popular
 </div>
 </>
 )}

 <div className="relative z-10 flex flex-col h-full">
 <h3 className={`text-2xl font-black mb-2 tracking-tight ${plan.popular ? 'text-white ' : 'text-slate-900 '}`}>{plan.name}</h3>
 <p className={`text-sm mb-8 font-medium min-h-[40px] ${plan.popular ? 'text-white/70 ' : 'text-slate-500 '}`}>{plan.desc}</p>

 <div className="mb-10">
 <span className={`text-5xl font-black tracking-tighter ${plan.popular ? 'text-white ' : 'text-slate-900 '}`}>{plan.price}</span>
 {plan.price !== 'Custom' && (
 <span className={`ml-2 text-sm font-medium ${plan.popular ? 'text-white/60 ' : 'text-slate-400'}`}>/{plan.period}</span>
 )}
 </div>

 <ul className="space-y-4 mb-10 flex-grow">
 {plan.features.map((feature, fIdx) => (
 <li key={fIdx} className="flex items-center gap-3">
 <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-emerald-500/20 /20' : 'bg-emerald-100 /30'}`}>
 <Check className="w-3 h-3 text-emerald-500" />
 </div>
 <span className={`text-sm font-medium ${plan.popular ? 'text-white/80 ' : 'text-slate-600 '}`}>{feature}</span>
 </li>
 ))}
 </ul>

 <button
 onClick={() => handlePayment(plan)}
 disabled={processingPlan === plan.name}
 className={`w-full py-5 rounded-2xl font-black text-center transition-all hover:-translate-y-1 ${
 plan.popular
 ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30'
 : 'bg-slate-100 hover:bg-slate-200 :bg-slate-700 text-slate-900 '
 } ${processingPlan === plan.name ? 'opacity-70 cursor-not-allowed translate-y-0' : ''}`}
 >
 {processingPlan === plan.name ? 'Connecting...' : (plan.price === 'Free' || plan.price === 'Custom' ? 'Contact Us' : plan.button)}
 </button>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
};

export default PricingSection;
