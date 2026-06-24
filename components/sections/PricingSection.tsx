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
};

export default PricingSection;
