import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db, onAuthStateChanged, doc, getDoc } from '../lib/firebase';

import type { User } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import type { Course } from '../types';
import { PLATFORM_COURSES } from '../data/platformCourses';

const LANGUAGES_CONFIG = [
  { code: 'en', name: 'English' }, { code: 'hi', name: 'हिन्दी (Hindi)' }, { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' }, { code: 'bn', name: 'বাংলা (Bengali)' }, { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'mr', name: 'मराठी (Marathi)' }, { code: 'doi', name: 'डोगरी (Dogri - Jammu)' }, { code: 'ks', name: 'کٲشُر (Kashmiri)' },
  { code: 'ur', name: 'اردو (Urdu)' }
] as const;

type LangCode = typeof LANGUAGES_CONFIG[number]['code'];

const formTranslations: Record<LangCode, { title: string; subtitle: string; fullName: string; fullNamePlh: string; email: string; emailPlh: string; phone: string; phonePlh: string; qualification: string; qualificationPlh: string; experience: string; experiencePlh: string; subjects: string; subjectsPlh: string; mode: string; modePlh: string; modeLive: string; modeRec: string; modeHyb: string; languages: string; otherLanguagesPlh: string; selectedCount: string; terms: string; submit: string; submitting: string; acceptTermsErr: string; }> = {
  en: { title: "Apply as Teacher", subtitle: "Share your expertise and start teaching", fullName: "Full Name", fullNamePlh: "Your full name", email: "Email Address", emailPlh: "email@example.com", phone: "Phone Number", phonePlh: "+91 98765 43210", qualification: "Highest Qualification", qualificationPlh: "e.g. B.Tech, M.Sc, Ph.D", experience: "Years of Experience", experiencePlh: "e.g. 3", subjects: "Subjects to Teach", subjectsPlh: "e.g. Algebra, Physics, Coding", mode: "Teaching Mode", modePlh: "Select mode", modeLive: "Live", modeRec: "Recorded", modeHyb: "Hybrid", languages: "Languages you teach", otherLanguagesPlh: "Other languages (e.g. French, German - comma separated)", selectedCount: "Total Languages Selected", terms: "I accept the Terms & Conditions for teaching on this platform.", submit: "Submit Application", submitting: "Submitting...", acceptTermsErr: "Please accept the terms" },
  hi: { title: "शिक्षक के रूप में आवेदन करें", subtitle: "अपनी विशेषज्ञता साझा करें और पढ़ाना शुरू करें", fullName: "पूरा नाम", fullNamePlh: "आपका पूरा नाम", email: "ईमेल पता", emailPlh: "email@example.com", phone: "फ़ोन नंबर", phonePlh: "+91 98765 43210", qualification: "उच्चतम योग्यता", qualificationPlh: "जैसे: बी.टेक, एम.एससी, पीएच.डी", experience: "अनुभव (वर्षों में)", experiencePlh: "जैसे: 3", subjects: "पढ़ाने के विषय", subjectsPlh: "जैसे: बीजगणित, भौतिकी, कोडिंग", mode: "पढ़ाने का माध्यम", modePlh: "माध्यम चुनें", modeLive: "लाइव (सजीव)", modeRec: "रिकॉर्डेड (दर्ज)", modeHyb: "हाइब्रिड (मिश्रित)", languages: "वे भाषाएँ जिनमें आप पढ़ाते हैं", otherLanguagesPlh: "अन्य भाषाएँ (जैसे: फ्रेंच, जर्मन - अल्पविराम से अलग करें)", selectedCount: "कुल चयनित भाषाएँ", terms: "मैं इस प्लेटफॉर्म पर पढ़ाने के लिए नियम और शर्तों को स्वीकार करता हूं।", submit: "आवेदन जमा करें", submitting: "जमा किया जा रहा है...", acceptTermsErr: "कृपया नियमों को स्वीकार करें" },
  te: { title: "ఉపాధ్యాయుడిగా దరఖాస్తు చేసుకోండి", subtitle: "మీ నైపుణ్యాన్ని పంచుకోండి మరియు బోధించడం ప్రారంభించండి", fullName: "పూర్తి పేరు", fullNamePlh: "మీ పూర్తి పేరు", email: "ఈమెయిల్ చిరునామా", emailPlh: "email@example.com", phone: "ఫోన్ నెంబర్", phonePlh: "+91 98765 43210", qualification: "అత్యున్నత అర్హత", qualificationPlh: "ఉదాహరణ: B.Tech, M.Sc, Ph.D", experience: "అనుభవ సంవత్సరాలు", experiencePlh: "ఉదాహరణ: 3", subjects: "బోధించాల్సిన సబ్జెక్టులు", subjectsPlh: "ఉదాహరణ: గణితం, భౌతికశాస్త్రం, కోడింగ్", mode: "బోధనా విధానం", modePlh: "విధానాన్ని ఎంచుకోండి", modeLive: "లైవ్", modeRec: "రికార్డ్ చేయబడినవి", modeHyb: "హైబ్రిడ్", languages: "మీరు బోధించే భాషలు", otherLanguagesPlh: "ఇతర భాషలు (ఉదాహరణ: ఫ్రెంచ్, జర్మన్ - కామాలతో వేరు చేయండి)", selectedCount: "ఎంపిక చేసిన మొత్తం భాషలు", terms: "ఈ ప్లాట్‌ఫారమ్‌లో బోధించడానికి నేను నిబంధనలు & షరతులను అంగీకరిస్తున్నాను.", submit: "దరఖాస్తును సమర్పించండి", submitting: "సమర్పిస్తోంది...", acceptTermsErr: "దయచేసి నిబంధనలను అంగీకరించండి" },
  ta: { title: "ஆசிரியராக விண்ணப்பிக்கவும்", subtitle: "உங்கள் நிபுணத்துவத்தைப் பகிர்ந்து கற்பிக்கத் தொடங்குங்கள்", fullName: "முழு பெயர்", fullNamePlh: "உங்களது முழு பெயர்", email: "மின்னஞ்சல் முகவரி", emailPlh: "email@example.com", phone: "தொலைபேசி எண்", phonePlh: "+91 98765 43210", qualification: "உயர்ந்த தகுதி", qualificationPlh: "उदा: B.Tech, M.Sc, Ph.D", experience: "அனுபவ ஆண்டுகள்", experiencePlh: "उदा: 3", subjects: "கற்பிக்க வேண்டிய பாடங்கள்", subjectsPlh: "उदा: கணிதம், இயற்பியல், கோடிங்", mode: "கற்பித்தல் முறை", modePlh: "முறையைத் தேர்ந்தெடுக்கவும்", modeLive: "நேரடி வகுப்பு (Live)", modeRec: "பதிவுசெய்யப்பட்டது (Recorded)", modeHyb: "கலப்பு முறை (Hybrid)", languages: "நீங்கள் கற்பிக்கும் மொழிகள்", otherLanguagesPlh: "இதர மொழிகள் (उदा: பிரெஞ்சு, ஜெர்மன் - காற்புள்ளியால் பிரிக்கப்பட்டது)", selectedCount: "தேர்வு செய்யப்பட்ட மொழிகள்", terms: "இந்தத் தளத்தில் கற்பிப்பதற்கான விதிமுறைகள் மற்றும் நிபந்தனைகளை நான் ஏற்கிறேன்.", submit: "விண்ணப்பத்தைச் சமர்ப்பிக்கவும்", submitting: "சமர்ப்பிக்கப்படுகிறது...", acceptTermsErr: "விதிமுறைகளை ஏற்கவும்" },
  bn: { title: "শিক্ষক হিসেবে আবেদন করুন", subtitle: "আপনার দক্ষতা শেয়ার করুন এবং শেখানো শুরু করুন", fullName: "সম্পূর্ণ নাম", fullNamePlh: "আপনার সম্পূর্ণ নাম", email: "ইমেল ঠিকানা", emailPlh: "email@example.com", phone: "ফোন নম্বর", phonePlh: "+91 98765 43210", qualification: "সর্বোচ্চ যোগ্যতা", qualificationPlh: "যেমন: B.Tech, M.Sc, Ph.D", experience: "অভিজ্ঞতার বছর", experiencePlh: "যেমন: ৩", subjects: "শেখানোর বিষয়সমূহ", subjectsPlh: "যেমন: গণিত, পদার্থবিজ্ঞান, কোডিং", mode: "শিক্ষাদান পদ্ধতি", modePlh: "পদ্ধতি নির্বাচন করুন", modeLive: "লাইভ ক্লাস", modeRec: "রেকর্ডকৃত ক্লাস", modeHyb: "হাইব্রিড ক্লাস", languages: "যেসব ভাষায় আপনি শেখান", otherLanguagesPlh: "অন্যান্য ভাষা (যেমন: ফরাসি, জার্মান - কমা দ্বারা পৃথক করা)", selectedCount: "মোট নির্বাচিত ভাষা", terms: "আমি এই প্ল্যাটফর্মে শেখানোর জন্য শর্তাবলী স্বীকার করছি।", submit: "আবেদন জমা দিন", submitting: "জমা দেওয়া হচ্ছে...", acceptTermsErr: "দয়া করে শর্তাবলী গ্রহণ করুন" },
  kn: { title: "ಶಿಕ್ಷಕರಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", subtitle: "ನಿಮ್ಮ ಪರಿಣತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ ಮತ್ತು ಬೋಧನೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ", fullName: "ಪೂರ್ಣ ಹೆಸರು", fullNamePlh: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು", email: "ಇಮೇಲ್ ವಿಳಾಸ", emailPlh: "email@example.com", phone: "ಫೋನ್ ಸಂಖ್ಯೆ", phonePlh: "+91 98765 43210", qualification: "ಅತ್ಯುನ್ನತ ಅರ್ಹತೆ", qualificationPlh: "ಉದಾ: B.Tech, M.Sc, Ph.D", experience: "ಅನುಭವದ ವರ್ಷಗಳು", experiencePlh: "ಉದಾ: 3", subjects: "ಬೋಧಿಸಬೇಕಾದ ವಿಷಯಗಳು", subjectsPlh: "ಉದಾ: ಗಣಿತ, ಭೌತಶಾಸ್ತ್ರ, ಕೋಡಿಂಗ್", mode: "ಬೋಧನಾ ವಿಧಾನ", modePlh: "ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ", modeLive: "ಲೈವ್", modeRec: "ರೆಕಾರ್ಡ್ ಮಾಡಿದ", modeHyb: "ಹೈಬ್ರಿಡ್", languages: "ನೀವು ಬೋಧಿಸುವ ಭಾಷೆಗಳು", otherLanguagesPlh: "ಇತರ ಭಾಷೆಗಳು (ಉದಾ: ಫ್ರೆಂಚ್, ಜರ್ಮನ್ - ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಿ)", selectedCount: "ಆಯ್ಕೆ ಮಾಡಿದ ಒಟ್ಟು ಭಾಷೆಗಳು", terms: "ಈ ಪ್ಲಾಟ್‌ಫಾರಮ್‌ನಲ್ಲಿ ಬೋಧಿಸಲು ನಾನು ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಒಪ್ಪುತ್ತೇನೆ.", submit: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", submitting: "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...", acceptTermsErr: "ದಯವಿಟ್ಟು ನಿಯಮಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ" },
  mr: { title: "शिक्षक म्हणून अर्ज करा", subtitle: "तुमची कौशल्ये सामायिक करा आणि शिकवण्यास सुरुवात करा", fullName: "पूर्ण नाव", fullNamePlh: "तुमचे पूर्ण नाव", email: "ईमेल पत्ता", emailPlh: "email@example.com", phone: "फोन नंबर", phonePlh: "+91 98765 43210", qualification: "उच्चतम पात्रता", qualificationPlh: "उदा. B.Tech, M.Sc, Ph.D", experience: "अनुभवाची वर्षे", experiencePlh: "उदा. ३", subjects: "शिकवायचे विषय", subjectsPlh: "उदा. गणित, भौतिकशास्त्र, कोडिंग", mode: "शिकवण्याची पद्धत", modePlh: "पद्धत निवडा", modeLive: "लाईव्ह", modeRec: "रेकॉर्ड केलेले", modeHyb: "हायब्रीड", languages: "तुम्ही शिकवत असलेल्या भाषा", otherLanguagesPlh: "इतर भाषा (उदा. फ्रेंच, जर्मन - स्वल्पविराम देऊन लिहा)", selectedCount: "एकूण निवडलेल्या भाषा", terms: "मी या प्लॅटफॉर्मवर शिकवण्यासाठी नियम व अटी मान्य करतो.", submit: "अर्ज सादर करा", submitting: "सादर होत आहे...", acceptTermsErr: "कृपया नियम आणि अटी स्वीकारा" },
  doi: { title: "शिक्षक दे रूप च अर्जी दिओ", subtitle: "अपनी महारत सांझी करो ते पढ़ाना शुरू करो", fullName: "पूरा नां", fullNamePlh: "तुंदा पूरा नां", email: "ईमेल पता", emailPlh: "email@example.com", phone: "फोन नंबर", phonePlh: "+91 98765 43210", qualification: "उच्चतम योग्यता", qualificationPlh: "जैसे: B.Tech, M.Sc, Ph.D", experience: "तजुरबा (बरें च)", experiencePlh: "जैसे: 3", subjects: "पढ़ाने दे विषय", subjectsPlh: "जैसे: गणित, भौतिक विज्ञान, कोडिंग", mode: "पढ़ाने दा तरीका", modePlh: "तरीका चुनो", modeLive: "सजीव (Live)", modeRec: "दर्ज कीती दी (Recorded)", modeHyb: "मिश्रित (Hybrid)", languages: "ओह भाषां जिनें च तुस पढ़ांदे ओ", otherLanguagesPlh: "दूइयां भाषां (जैसे: फ्रेंच, जर्मन - कोमा लाई के लिखो)", selectedCount: "कुल चुनी दियूं भाषां", terms: "मैं इस प्लेटफॉर्म पर पढ़ाने दियां शर्तां गी मंजूर करदा हां।", submit: "अर्जी जमा करो", submitting: "जमा कीती जा करदी ऐ...", acceptTermsErr: "मेहरबानी करी शर्तां मंजूर करो" },
  ks: { title: "اُستاد بننہ خاطرہ دَرخواست دِیِو", subtitle: "پَنُن عِلم کٔرِو شیئر تہِ پٔڑناوُن کٔرِو شُروع", fullName: "پوٗر مُٹھ ناڤ", fullNamePlh: "تُہند پوٗر ناڤ", email: "ای میل پتہ", emailPlh: "email@example.com", phone: "فون نمبر", phonePlh: "+91 98765 43210", qualification: "اعلیٰ تعلیمی قابلیت", qualificationPlh: "مثال: B.Tech, M.Sc, Ph.D", experience: "تجرُبہ (ورین منز)", experiencePlh: "مثال: 3", subjects: "پٔڑناونہِ والیہِ مَضموٗن", subjectsPlh: "مثال: ریاضی، طبیعیات، کوڈنگ", mode: "پٔڑناونُک طریقہ", modePlh: "طریقہ دِیِو مُنتخب کٔرتھ", modeLive: "لائیو (براہ راست)", modeRec: "ریکارڈ کٔرمُت", modeHyb: "ملا جلا (ہائبرڈ)", languages: "تِم زَبانہِ یِمن منز تُہہِ پٔڑناوان چھِو", otherLanguagesPlh: "باقیہِ زَبانہِ (مثال: فرانسیسی، جرمن - کامہِ دِتھ لیکھِو)", selectedCount: "کُل مُنتخب کٔرمژہ زَبانہِ", terms: "بہٗ چُھس پٔڑناونہِ خاطرہ اَتھ پليٹ فارمچہِ شَرائط مَنظوٗر کَران۔", submit: "درخواست جمع کٔرِو", submitting: "جمع گژھان چھُ...", acceptTermsErr: "مہربانی کرتھ قبول کریو شرائط" },
  ur: { title: "بطور استاد درخواست دیں", subtitle: "اپنی مہارت کا اشتراک کریں اور پڑھانا شروع کریں", fullName: "پورا نام", fullNamePlh: "آپ کا پورا نام", email: "ای میل پتہ", emailPlh: "email@example.com", phone: "فون نمبر", phonePlh: "+91 98765 43210", qualification: "اعلیٰ ترین قابلیت", qualificationPlh: "مثلاً: B.Tech, M.Sc, Ph.D", experience: "تجربہ (سالوں میں)", experiencePlh: "مثلاً: 3", subjects: "پڑھانے کے مضامین", subjectsPlh: "مثلاً: حساب، فزکس، کوڈنگ", mode: "پڑھانے کا طریقہ", modePlh: "طریقہ منتخب کریں", modeLive: "لائیو", modeRec: "ریکارڈ شدہ", modeHyb: "ہائیبرڈ", languages: "وہ زبانیں جن میں آپ پڑھاتے ہیں", otherLanguagesPlh: "دیگر زبانیں (مثلاً: فرانسیسی، جرمن - کوما سے الگ کریں)", selectedCount: "کل منتخب کردہ زبانیں", terms: "میں اس پلیٹ فارم پر پڑھانے کے لیے شرائط و ضوابط تسلیم کرتا ہوں۔", submit: "درخواست جمع کریں", submitting: "جمع ہو رہا ہے...", acceptTermsErr: "براہ کرم شرائط قبول کریں" }
};

const TeacherApplication: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetCourseId = searchParams.get('courseId') || '';
  const [targetCourse, setTargetCourse] = useState<Course | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formLang, setFormLang] = useState<LangCode>('en');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [subjects, setSubjects] = useState('');
  const [mode, setMode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [customLanguages, setCustomLanguages] = useState('');

  const t = formTranslations[formLang];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) { navigate('/login'); return; }
      setName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchTargetCourse = async () => {
      if (!targetCourseId) return;
      try {
        let foundCourse: Course | null = null;
        const courseDoc = await getDoc(doc(db, 'courses', targetCourseId));
        if (courseDoc.exists()) { foundCourse = { id: courseDoc.id, ...courseDoc.data() } as Course; }
        else { const idx = PLATFORM_COURSES.findIndex((_, i) => `pc-${i}` === targetCourseId); if (idx !== -1) foundCourse = { id: `pc-${idx}`, ...PLATFORM_COURSES[idx] } as Course; }
        setTargetCourse(foundCourse);
      } catch (err) { console.error("Failed to load target course details", err); }
    };
    fetchTargetCourse();
  }, [targetCourseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!agreeTerms) { toast.error(t.acceptTermsErr); return; }
    if (!name.trim()) { toast.error('Full name is required'); return; }
    if (name.trim().length < 2) { toast.error('Full name must be at least 2 characters'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error('Please enter a valid email address'); return; }
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10) { toast.error('Phone number must have at least 10 digits'); return; }
    if (/^0+$/.test(phoneDigits)) { toast.error('Phone number cannot be all zeros'); return; }
    if (!experience || isNaN(Number(experience)) || Number(experience) < 0) { toast.error('Please enter valid years of experience'); return; }
    if (!qualification.trim()) { toast.error('Please enter your highest qualification'); return; }
    if (!subjects.trim()) { toast.error('Please enter the subjects you teach'); return; }

    const finalLanguagesList = [...selectedLanguages, ...customLanguages.split(',').map(s => s.trim()).filter(Boolean)];
    const languagesStr = finalLanguagesList.join(', ');
    const languagesCount = finalLanguagesList.length;

    setSubmitLoading(true);
    try {
      const { error } = await db.from('teacher_applications').insert({
        user_id: user.uid, name, email, phone, qualification: targetCourseId || '',
        highest_qualification: qualification, experience, subjects, languages: languagesStr,
        languages_count: languagesCount, teaching_mode: mode, agree_terms: agreeTerms,
        status: 'pending', applied_at: new Date().toISOString()
      });
      if (error) throw error;
      toast.success('Application submitted successfully!');
      navigate('/');
    } catch (err: any) { console.error(err); toast.error(err?.message || 'Failed to submit application'); }
    finally { setSubmitLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex" style={{ flexDirection: 'column', gap: 16 }}>
        <div className="skeleton skeleton-title" style={{ width: 180 }} />
        <div className="skeleton skeleton-text" style={{ width: 240 }} />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn btn-sm btn-secondary" style={{ marginBottom: 16 }}>
Back
      </button>

      <div className="bento-card" style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex" style={{ alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--accent-soft)' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{t.title}</h1>
            <p style={{ margin: 0 }}>{t.subtitle}</p>
          </div>
        </div>

        {/* Target Course Banner */}
        {targetCourse && (
          <div className="bento-card-accent bento-card-compact" style={{ marginBottom: 20 }}>
            <div className="flex" style={{ alignItems: 'center', gap: 12 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--accent)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <div>
                <span className="flabel">Applying for Course</span>
                <h4 style={{ margin: 0 }}>{targetCourse.title}</h4>
                <div className="flex" style={{ gap: 6, marginTop: 4 }}>
                  <span className="badge" style={{ fontSize: '0.65rem' }}>{targetCourse.category}</span>
                  {targetCourse.duration && <span className="badge" style={{ fontSize: '0.65rem' }}>{targetCourse.duration}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Language Toggle */}
        <div className="flex" style={{ gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {LANGUAGES_CONFIG.map((lang) => (
            <button key={lang.code} type="button" onClick={() => setFormLang(lang.code)}
              className="btn btn-xs"
              style={{ background: formLang === lang.code ? 'var(--accent)' : 'transparent', color: formLang === lang.code ? '#fff' : 'var(--ink)', borderColor: formLang === lang.code ? 'var(--accent)' : 'var(--ink)' }}
            >{lang.name}</button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t.fullName}</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder={t.fullNamePlh} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.email}</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t.emailPlh} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.phone}</label>
              <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t.phonePlh} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.qualification}</label>
              <input className="input" value={qualification} onChange={e => setQualification(e.target.value)} placeholder={t.qualificationPlh} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.experience}</label>
              <input className="input" type="number" min="0" value={experience} onChange={e => setExperience(e.target.value)} placeholder={t.experiencePlh} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.subjects}</label>
              <input className="input" value={subjects} onChange={e => setSubjects(e.target.value)} placeholder={t.subjectsPlh} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.mode}</label>
              <select className="input" value={mode} onChange={e => setMode(e.target.value)}>
                <option value="">{t.modePlh}</option>
                <option value="live">{t.modeLive}</option>
                <option value="recorded">{t.modeRec}</option>
                <option value="hybrid">{t.modeHyb}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t.languages}</label>
            <div className="flex" style={{ gap: 4, flexWrap: 'wrap' }}>
              {['English', 'Hindi', 'Telugu', 'Spanish', 'Bengali', 'Tamil', 'Kannada', 'Marathi'].map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <button key={lang} type="button" onClick={() => { isSelected ? setSelectedLanguages(selectedLanguages.filter(l => l !== lang)) : setSelectedLanguages([...selectedLanguages, lang]); }}
                    className="btn btn-xs"
                    style={{ background: isSelected ? 'var(--accent)' : 'transparent', color: isSelected ? '#fff' : 'var(--ink)', borderColor: isSelected ? 'var(--accent)' : 'var(--ink)' }}
                  >{lang}</button>
                );
              })}
            </div>
            <input className="input" value={customLanguages} onChange={e => setCustomLanguages(e.target.value)} placeholder={t.otherLanguagesPlh} style={{ marginTop: 8 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)', marginTop: 4, display: 'block' }}>
              {t.selectedCount}: <strong>{(selectedLanguages.length + customLanguages.split(',').map(s => s.trim()).filter(Boolean).length)}</strong>
            </span>
          </div>

          <div className="asc" />

          <label className="flex" style={{ alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: '0.85rem' }}>{t.terms}</span>
          </label>

          <button type="submit" disabled={submitLoading} className="btn btn-primary btn-full">

            {submitLoading ? t.submitting : t.submit}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherApplication;
