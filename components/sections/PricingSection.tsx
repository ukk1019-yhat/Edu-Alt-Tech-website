import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

const plans = [
  {
    name: 'Basic Plan',
    desc: 'Free for students to access essential features.',
    price: 'Free',
    period: 'forever',
    features: ['Student App Access', 'Timetable Viewing', 'Homework Submission', 'Basic Notifications'],
    popular: false,
    button: 'Get Started'
  },
  {
    name: 'School Plan',
    desc: 'Full digital ecosystem for your institution.',
    price: '₹1',
    period: 'per student / mo',
    features: ['Everything in Basic', 'Teacher Dashboard', 'Parent App', 'Attendance Tracking', 'Curriculum Integration'],
    popular: true,
    button: 'Choose Plan'
  },
  {
    name: 'Premium',
    desc: 'Advanced tools tailored for modern educators.',
    price: 'Custom',
    period: 'billed annually',
    features: ['Everything in School', 'Advanced Admin Analytics', '1-on-1 Mentorship Tools', 'AI-Driven Insights', 'Priority Support'],
    popular: false,
    button: 'Contact Sales'
  }
];

const PricingSection: React.FC = () => {
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
      window.location.href = "mailto:edualtstudy@gmail.com";
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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SUbr4cftio73uJ", 
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
    <section className="py-24 md:py-40 bg-slate-50 dark:bg-[#020617] transition-colors duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4xKSIvPjwvc3ZnPg==')] opacity-50 dark:opacity-20 pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest text-xs mb-8 shadow-sm">
            Transparent Pricing
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[0.95]">
            Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Scalable</span> Plans
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
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
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-900/20 dark:shadow-white/10'
                  : 'bg-white dark:bg-slate-900/60 backdrop-blur border border-slate-200/50 dark:border-slate-800/50 shadow-xl'
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
                <h3 className={`text-2xl font-black mb-2 tracking-tight ${plan.popular ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>{plan.name}</h3>
                <p className={`text-sm mb-8 font-medium min-h-[40px] ${plan.popular ? 'text-white/70 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>{plan.desc}</p>

                <div className="mb-10">
                  <span className={`text-5xl font-black tracking-tighter ${plan.popular ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>{plan.price}</span>
                  {plan.price !== 'Custom' && (
                    <span className={`ml-2 text-sm font-medium ${plan.popular ? 'text-white/60 dark:text-slate-500' : 'text-slate-400'}`}>/{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-4 mb-10 flex-grow">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-emerald-500/20 dark:bg-emerald-500/20' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                        <Check className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className={`text-sm font-medium ${plan.popular ? 'text-white/80 dark:text-slate-700' : 'text-slate-600 dark:text-slate-300'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePayment(plan)}
                  disabled={processingPlan === plan.name}
                  className={`w-full py-5 rounded-2xl font-black text-center transition-all hover:-translate-y-1 ${
                    plan.popular
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
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
