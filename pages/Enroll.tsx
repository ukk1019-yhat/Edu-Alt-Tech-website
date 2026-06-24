
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LINKS } from '../constants';
import { toast } from 'react-hot-toast';

const Enroll: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goal: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTwWclKSEHufZYCteDWd2IE9oLMuTBMcEeu7s7V8iAFyuX4JmJMP-EsQetgxkcca6Yzg/exec';

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      setIsSubmitting(false);
      setIsDone(true);

      setTimeout(() => {
        window.open(LINKS.enroll, '_blank');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('There was an error submitting your enrollment. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div>
        <div />
        <div>
          <div>
            ✓
          </div>
          <div>
            <h2>Step 1 Complete!</h2>
            <p>
              We've opened the final enrollment form in a new tab. Please complete it to finalize your application.
            </p>
          </div>
          <div>
            <a href={LINKS.enroll} target="_blank" rel="noopener noreferrer">
              Didn't open? Click here ↗
            </a>
            <Link to="/">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div />
      <div>
        <div>
          <div>
            <h1>
              Start Your Alternative Learning Journey
            </h1>
            <p>
              Take the first step towards a structured, accountability-driven education. Join a community of doers and bridge the execution gap.
            </p>
            <div>
              {["Join a peer-driven ecosystem","Access structured weekly plans","Get mentored by execution experts","Connect with driven students"].map(item => (
                <div key={item}>
                  <div>
                    ✓
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit}>
              <div>
                <div>
                  <label>Full Name</label>
                  <input type="text" required placeholder="Enter your full name"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label>Email Address</label>
                  <input type="email" required placeholder="name@example.com"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label>Phone Number</label>
                  <input type="tel" required placeholder="+91 XXXXX XXXXX"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label>Main Goal in Learning</label>
                  <textarea required placeholder="What is your biggest execution hurdle?"
                    value={formData.goal} onChange={e => setFormData({ ...formData, goal: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>⏳Processing...</>
                ) : (
                  <>Proceed to Enrollment →</>
                )}
              </button>
              <p>By proceeding, you agree to our Terms of Service and Privacy Policy.</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enroll;
