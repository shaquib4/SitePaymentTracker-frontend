import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Language = 'en' | 'hi';
const LanguageContext = createContext<{ language: Language; toggleLanguage: () => void }>({
  language: 'en', toggleLanguage: () => undefined,
});
const translationCache = new WeakMap<Node, { source: string; rendered: string }>();

const words: Record<string, string> = {
  'Application Error Encountered': 'ऐप में दिक्कत आ गई',
  'An unexpected error occurred while rendering the dashboard.': 'डैशबोर्ड खोलते समय कुछ गड़बड़ हो गई।',
  'Reload Page': 'पेज फिर से खोलें', 'Clear Session & Sign In': 'लॉगिन हटाकर फिर से साइन इन करें',
  'Loading Module Bundle...': 'पेज खुल रहा है...', 'Install App': 'ऐप इंस्टॉल करें', 'Sign out': 'साइन आउट करें',
  'Company:': 'कंपनी:', 'Enterprise': 'एंटरप्राइज़', 'Admin': 'एडमिन', 'Accountant': 'अकाउंटेंट',
  'Supervisor': 'सुपरवाइज़र', 'Office Worker': 'ऑफिस कर्मचारी', 'Vendor': 'वेंडर',
  'Dashboard': 'डैशबोर्ड', 'Overview': 'एक नज़र में', 'Payments': 'भुगतान', 'Payment': 'भुगतान',
  'Expenses': 'खर्चे', 'Expense': 'खर्च', 'Sites': 'साइटें', 'Project Sites': 'प्रोजेक्ट साइटें',
  'Employees': 'कर्मचारी', 'Employee': 'कर्मचारी', 'Workers': 'मज़दूर', 'Labourers': 'मज़दूर',
  'Add Employee': 'कर्मचारी जोड़ें', 'Add New Employee': 'नया कर्मचारी जोड़ें', 'Add Labourer': 'मज़दूर जोड़ें',
  'Add Worker': 'मज़दूर जोड़ें', 'Edit': 'बदलें', 'Delete': 'हटाएँ', 'Save': 'सेव करें', 'Cancel': 'रद्द करें',
  'Close': 'बंद करें', 'Back': 'वापस जाएँ', 'Search': 'ढूँढें', 'Filter': 'फ़िल्टर करें', 'Reset Filters': 'फ़िल्टर हटाएँ',
  'All': 'सभी', 'All Sites': 'सभी साइटें', 'All Employees': 'सभी कर्मचारी', 'All Statuses': 'सभी स्थिति',
  'Status': 'स्थिति', 'Category': 'खर्च का प्रकार', 'Description': 'जानकारी', 'Amount': 'रकम',
  'Requested Amount': 'माँगी गई रकम', 'Approved Amount': 'मंज़ूर रकम', 'Date': 'तारीख', 'Start Date': 'शुरू की तारीख',
  'End Date': 'आख़िरी तारीख', 'Period': 'समय', 'This Year': 'इस साल', 'Full Year': 'पूरा साल',
  'Last 30 Days': 'पिछले 30 दिन', 'Year': 'साल', 'Month': 'महीना', 'Today': 'आज', 'Yesterday': 'कल',
  'Pending': 'जाँच बाकी', 'Approved': 'मंज़ूर', 'Rejected': 'नामंज़ूर', 'Info Requested': 'और जानकारी चाहिए',
  'Awaiting approval': 'मंज़ूरी का इंतज़ार है', 'Awaiting approval in this period': 'इस समय की मंज़ूरी बाकी है',
  'Total': 'कुल', 'Total Claims': 'कुल अनुरोध', 'Lifetime Total Approved': 'अब तक कुल मंज़ूर रकम',
  'Lifetime Approved': 'अब तक मंज़ूर', 'Lifetime Pending': 'अब तक जाँच बाकी', 'Period Grand Total': 'इस समय का कुल',
  'Approved Claims': 'मंज़ूर अनुरोध', 'Pending Review': 'जाँच बाकी', 'Total Site Expenses': 'साइट का कुल खर्च',
  'Expense Category Distribution': 'खर्च का बँटवारा', 'Expense Breakdown': 'खर्च का ब्योरा',
  'Request Payment': 'भुगतान माँगें', 'Request Payment / Claim': 'खर्च के पैसे माँगें', 'Submit Claim': 'अनुरोध भेजें',
  'Submit Request': 'अनुरोध भेजें', 'New Payment Request': 'भुगतान का नया अनुरोध', 'Payment Request': 'भुगतान का अनुरोध',
  'Approve': 'मंज़ूर करें', 'Reject': 'नामंज़ूर करें', 'Request Information': 'और जानकारी माँगें',
  'Approval Status': 'मंज़ूरी की स्थिति', 'Approval Note': 'मंज़ूरी पर नोट', 'Approval Comments': 'मंज़ूरी पर टिप्पणी',
  'Expense Title': 'खर्च का नाम', 'Title': 'नाम', 'Notes': 'नोट', 'Reason': 'वजह', 'Site': 'साइट', 'Select Site': 'साइट चुनें',
  'Select Category': 'खर्च का प्रकार चुनें', 'Choose a site': 'साइट चुनें', 'Choose category': 'खर्च का प्रकार चुनें',
  'No records found': 'कोई जानकारी नहीं मिली', 'No data available': 'अभी कोई जानकारी नहीं है', 'Loading...': 'खुल रहा है...',
  'Please wait...': 'ज़रा रुकें...', 'Next': 'आगे', 'Previous': 'पीछे', 'Page': 'पेज', 'of': 'में से',
  'Install KE Payment Tracker on your phone or desktop': 'KE Payment Tracker अपने फ़ोन या कंप्यूटर पर इंस्टॉल करें',
  'All Project Sites (Full View)': 'सभी प्रोजेक्ट साइटें', 'All Site Records': 'साइट के सभी रिकॉर्ड',
  'Filter records...': 'रिकॉर्ड ढूँढें...', 'Search employees...': 'कर्मचारी ढूँढें...', 'Search sites...': 'साइट ढूँढें...',
  'Back to Sites & Profitability': 'साइटों और मुनाफ़े पर वापस जाएँ', 'Company Dashboard': 'कंपनी का डैशबोर्ड',
  'Muster Roll': 'मज़दूरों की हाज़िरी', 'Daily Wage': 'दिहाड़ी', 'Wage Request': 'दिहाड़ी का अनुरोध',
  'Name': 'नाम', 'Phone': 'फ़ोन नंबर', 'Email': 'ईमेल', 'User ID': 'यूज़र आईडी',
  'Password': 'पासवर्ड', 'Login': 'लॉगिन करें', 'Sign In': 'साइन इन करें', 'Welcome Back': 'वापस स्वागत है',
  'Forgot Password?': 'पासवर्ड भूल गए?', 'Email or User ID': 'ईमेल या यूज़र आईडी', 'Enter your password': 'अपना पासवर्ड लिखें',
  'Quick Login': 'जल्दी लॉगिन करें', 'Choose a role': 'अपना काम चुनें', 'Admin Login': 'एडमिन लॉगिन',
  'Accountant Login': 'अकाउंटेंट लॉगिन', 'Supervisor Login': 'सुपरवाइज़र लॉगिन', 'Office Worker Login': 'ऑफिस कर्मचारी लॉगिन',
  'Site Expenses': 'साइट का खर्च', 'Profitability': 'मुनाफ़े का हिसाब', 'Final Payment Received': 'आख़िरी भुगतान मिला',
  'Current Margin / Net Profit': 'अभी का मुनाफ़ा', 'MB Valuation': 'मेज़रमेंट बुक की रकम', 'Approved On:': 'मंज़ूर होने की तारीख:',
  'Requested Date:': 'अनुरोध की तारीख:', 'Expense Duration:': 'खर्च का समय:', 'Duration:': 'समय:',
  'Category & Site': 'खर्च का प्रकार और साइट', 'Calendar Dates Record': 'तारीखों का रिकॉर्ड', 'Amount (₹)': 'रकम (₹)',
  'Audit / Approval Note': 'जाँच / मंज़ूरी पर नोट', 'No approved expenses in this period.': 'इस समय में कोई खर्च मंज़ूर नहीं हुआ।',
  'Employee Expenses': 'कर्मचारी के खर्च', 'View Details': 'ब्योरा देखें', 'Details': 'ब्योरा', 'Export Excel': 'Excel डाउनलोड करें',
  'Export PDF': 'PDF डाउनलोड करें', 'Download': 'डाउनलोड करें', 'Refresh': 'फिर से लोड करें', 'Install': 'इंस्टॉल करें',
  'English': 'अंग्रेज़ी', 'Hindi': 'हिंदी', 'हिन्दी': 'हिंदी', 'Switch to Hindi': 'हिंदी में देखें', 'Switch to English': 'अंग्रेज़ी में देखें',
  'Audit Files': 'जाँच की फ़ाइलें', 'Generate Report': 'रिपोर्ट बनाएँ', 'Regenerate': 'फिर से बनाएँ', 'Delete Report': 'रिपोर्ट हटाएँ',
  'Information': 'जानकारी', 'Required': 'ज़रूरी', 'Optional': 'ज़रूरी नहीं', 'Select': 'चुनें', 'Other': 'दूसरा',
  'Material': 'सामान', 'Travel': 'यात्रा', 'Supplies': 'सामान', 'Utilities': 'बिजली-पानी', 'Office Supplies': 'ऑफिस का सामान',
  'Admin Dashboard': 'एडमिन डैशबोर्ड', 'Accountant Dashboard': 'अकाउंटेंट डैशबोर्ड',
  'Supervisor Dashboard': 'सुपरवाइज़र डैशबोर्ड', 'Office Worker Dashboard': 'ऑफिस कर्मचारी डैशबोर्ड',
  'Add to Home Screen': 'होम स्क्रीन पर जोड़ें', 'Confirm "Add"': '“जोड़ें” पर टैप करें',
  'Locked Down & Ready': 'सुरक्षित और तैयार', 'Tap Share Button': 'शेयर बटन दबाएँ',
  'Accountant Verification Ledger': 'अकाउंटेंट की जाँच सूची', 'Across filtered sites': 'चुनी हुई साइटों का कुल',
  'Actions': 'काम', 'Active': 'चालू', 'Active Worker Roster': 'काम कर रहे मज़दूर',
  'Actual Expenses': 'असल खर्च', 'Add Expense Category': 'खर्च का प्रकार जोड़ें',
  'Admin Audit Files & Background Reports': 'एडमिन की जाँच फ़ाइलें और रिपोर्ट',
  'Admin Gatekeeper & Master Ledger': 'एडमिन की मुख्य भुगतान सूची', 'Admin Review Notes': 'एडमिन की जाँच टिप्पणी',
  'All Categories': 'खर्च के सभी प्रकार', 'All Supervisors': 'सभी सुपरवाइज़र',
  'Approval Notes': 'मंज़ूरी पर टिप्पणी', 'Approved & Disbursed': 'मंज़ूर और भेजा गया',
  'Approved Payouts': 'मंज़ूर भुगतान', 'Assigned Supervisor': 'ज़िम्मेदार सुपरवाइज़र',
  'Audit History / Notes': 'जाँच का रिकॉर्ड / टिप्पणी', 'Awaiting Verification': 'जाँच बाकी',
  'Breakdown PDF + Excel': 'खर्च का PDF और Excel', 'Breakdown-only PDF': 'खर्च के ब्योरे का PDF',
  'By supervisors': 'सुपरवाइज़र के हिसाब से', 'Calendar Duration': 'समय की अवधि',
  'Calendar Duration & Record': 'समय और रिकॉर्ड', 'Calendar Period Filter & Spend Record': 'समय चुनें और खर्च देखें',
  'Category Name': 'खर्च के प्रकार का नाम', 'Claim': 'अनुरोध', 'Claim Material Expense': 'सामान के खर्च का अनुरोध',
  'Claim Title & Details': 'अनुरोध का नाम और जानकारी', 'Clarifications': 'जवाब', 'Completed': 'पूरा हुआ',
  'Completed & Disbursed': 'पूरा हुआ और भुगतान भेजा गया', 'Completed / Disbursed': 'पूरा हुआ / भुगतान भेजा गया',
  'Completed / Paid': 'पूरा हुआ / भुगतान किया गया', 'Confirm Payment Disbursement': 'भुगतान भेजने की पुष्टि करें',
  'Construction Sites & Profitability Ledger': 'निर्माण साइटों और मुनाफ़े का हिसाब', 'Create Project Site': 'प्रोजेक्ट साइट बनाएँ',
  'Dates': 'तारीखें', 'Days Worked': 'काम के दिन', 'Department': 'विभाग', 'Disbursed Funds': 'भेजी गई रकम',
  'Disbursed to workers': 'मज़दूरों को भेजी गई', 'Edit Labourer & Site Assignment': 'मज़दूर और साइट की जानकारी बदलें',
  'Email Address or 6-Digit User ID': 'ईमेल या 6 अंकों की यूज़र आईडी',
  'name@company.com or 6-digit ID (e.g. 749201)': 'ईमेल या 6 अंकों की आईडी लिखें',
  'Quick Demo Credentials (Khan Enterprises):': 'खान एंटरप्राइज़ेज़ के डेमो लॉगिन:',
  'Expected vs Claimed': 'होना चाहिए था और माँगी गई रकम', 'Expected Wages': 'बनती हुई दिहाड़ी',
  'Expense Breakdown by Category': 'खर्च के प्रकार के हिसाब से ब्योरा', 'Expense Categories': 'खर्च के प्रकार',
  'Expense Details': 'खर्च की जानकारी', 'Expense Distribution by Construction Site': 'निर्माण साइट के हिसाब से खर्च',
  'Expenses Excel': 'खर्च की Excel फ़ाइल', 'Failed to load site expenses.': 'साइट का खर्च नहीं खुल पाया।',
  'Final Received': 'आख़िरी भुगतान मिला', 'Flagged for Admin Call': 'एडमिन से बात करनी है',
  'Full Name': 'पूरा नाम', 'General / Head Office (No Specific Site)': 'मुख्य ऑफिस (कोई तय साइट नहीं)',
  'Generate Employee & 6-Digit ID': 'कर्मचारी और 6 अंकों की आईडी बनाएँ', 'Employee Generated!': 'कर्मचारी जुड़ गया!',
  'Employee Roster & Six-Digit IDs': 'कर्मचारियों और उनकी आईडी की सूची', 'Hover or click a site slice to filter': 'खर्च छाँटने के लिए साइट पर क्लिक करें',
  'Hover or click a slice to inspect': 'ब्योरा देखने के लिए यहाँ क्लिक करें', 'In Admin Queue': 'एडमिन की जाँच में',
  'Labour requests awaiting Admin approval': 'एडमिन की मंज़ूरी के इंतज़ार में मज़दूरी अनुरोध',
  'Labourer Name': 'मज़दूर का नाम', 'Labourer Profile': 'मज़दूर की जानकारी',
  'Labourer Wage & Anti-Exploitation Audit': 'मज़दूरी का हिसाब और जाँच', 'Labourers & Anti-Exploitation Wage Audit': 'मज़दूर और मज़दूरी की जाँच',
  'Loading period requests...': 'समय के अनुरोध खुल रहे हैं...', 'Location': 'जगह', 'MB Valuation (Opt.)': 'मेज़रमेंट बुक की रकम (ज़रूरी नहीं)',
  'MB Value (Opt.)': 'मेज़रमेंट बुक की रकम (ज़रूरी नहीं)', 'Measurement Book Valuation': 'मेज़रमेंट बुक की रकम',
  'My Managed Labourers': 'मेरे मज़दूर', 'No Audit Packs Generated Yet': 'अभी कोई जाँच फ़ाइल नहीं बनी',
  'No Expense Breakdown Recorded': 'खर्च का कोई ब्योरा नहीं मिला', 'No notes': 'कोई टिप्पणी नहीं', 'No notes yet': 'अभी कोई टिप्पणी नहीं',
  'No Phone': 'फ़ोन नंबर नहीं है', 'No Site Expenses Recorded': 'साइट का कोई खर्च दर्ज नहीं है',
  'Office Worker (Personal Claims & Historical Audit)': 'ऑफिस कर्मचारी (अपने खर्च और पुराने रिकॉर्ड)',
  'Onboard Labourer': 'मज़दूर जोड़ें', 'Onboard Labourer (Admin Authority)': 'एडमिन की मंज़ूरी से मज़दूर जोड़ें',
  'Onboarding Authority': 'जोड़ने की मंज़ूरी', 'Onboarding Authority (Who Added Whom)': 'किसने किसे जोड़ा',
  'Payment & Calendar Record': 'भुगतान और तारीखों का रिकॉर्ड', 'Pending Queue': 'मंज़ूरी का इंतज़ार',
  'Pending Wage Payouts (₹)': 'बाकी मज़दूरी का भुगतान (₹)', 'Period Approved': 'इस समय में मंज़ूर',
  'Period Dates': 'इस समय की तारीखें', 'Period Pending': 'इस समय में जाँच बाकी', 'Period Verified': 'इस समय में जाँचा गया',
  'Phone (Click-to-Call)': 'फ़ोन (कॉल करने के लिए दबाएँ)', 'Photo URL (Optional)': 'फ़ोटो का लिंक (ज़रूरी नहीं)',
  'Physical project locations': 'प्रोजेक्ट की जगहें', 'Prev': 'पीछे', 'Project Site': 'प्रोजेक्ट साइट',
  'Record Final Settlement': 'आख़िरी भुगतान दर्ज करें', 'Registered Labourers': 'दर्ज मज़दूर',
  'Request Clarifications / Info': 'और जानकारी माँगें', 'Request More Details': 'और जानकारी माँगें', 'Reset': 'हटाएँ',
  'Review, Edit & Approve Expense': 'खर्च देखें, बदलें और मंज़ूर करें', 'Role': 'काम', 'Role & Dept': 'काम और विभाग',
  'Select a Category': 'खर्च का प्रकार चुनें', 'Select Labourer': 'मज़दूर चुनें', 'Share': 'शेयर करें',
  'Site Name': 'साइट का नाम', 'Six-Digit ID': '6 अंकों की आईडी', 'Strictly separates wage claims from materials': 'मज़दूरी और सामान के खर्च अलग रखता है',
  'Submission & Approval Timestamps': 'भेजने और मंज़ूरी की तारीख', 'Submit Labour Wage Request': 'मज़दूरी का अनुरोध भेजें',
  'Supervisor / Submitter': 'सुपरवाइज़र / अनुरोध भेजने वाला', 'Supervisor Site & Labour Management': 'साइट और मज़दूरों का काम',
  'Total Approved (₹)': 'कुल मंज़ूर (₹)', 'Total Claimed': 'कुल माँगी गई रकम', 'Total Days Claimed': 'कुल माँगे गए दिन',
  'Total Paid': 'कुल भुगतान', 'Total Wages Claimed': 'कुल माँगी गई मज़दूरी', 'Unassigned (No Fixed Site)': 'किसी साइट पर तय नहीं',
  'Verification Action': 'जाँच का फ़ैसला', 'Verified & Approved': 'जाँचा और मंज़ूर किया', 'Wage Amount (₹)': 'मज़दूरी (₹)',
  'Wage Claim': 'मज़दूरी का अनुरोध', 'Wage Rate & Payouts': 'मज़दूरी की दर और भुगतान', 'Work Duration': 'काम की अवधि',
  'Worker Full Name': 'मज़दूर का पूरा नाम', 'Worker Profile': 'मज़दूर की जानकारी', 'Year 2023 (Historical)': 'साल 2023 (पुराना रिकॉर्ड)',
  'Year 2024 (Historical)': 'साल 2024 (पुराना रिकॉर्ड)', 'Year 2025 (Historical)': 'साल 2025 (पुराना रिकॉर्ड)',
  'Year 2026 (Active)': 'साल 2026 (अभी)', 'Login failed.': 'लॉगिन नहीं हो पाया।', 'Authenticating...': 'लॉगिन हो रहा है...',
  'Shaquib Khan (Admin)': 'शाकिब खान (एडमिन)', 'Ramesh Sharma (Accountant)': 'रमेश शर्मा (अकाउंटेंट)',
  'Surendra Kumar (Supervisor)': 'सुरेंद्र कुमार (सुपरवाइज़र)', 'Neha Sharma (Office Worker)': 'नेहा शर्मा (ऑफिस कर्मचारी)',
  'Apex Supplies (Vendor)': 'एपेक्स सप्लाइज़ (वेंडर)',
};

const translate = (value: string) => words[value.trim()] ?? value;

function applyTranslations(root: Node, language: Language, cache: WeakMap<Node, { source: string; rendered: string }>) {
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const current = node.nodeValue ?? '';
      const old = cache.get(node);
      const source = old && current === old.rendered ? old.source : current;
      if (!source.trim()) return;
      const rendered = language === 'hi' ? translate(source) : source;
      cache.set(node, { source, rendered });
      if (current !== rendered) node.nodeValue = rendered;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    for (const attr of ['placeholder', 'title', 'aria-label']) {
      const value = element.getAttribute(attr);
      if (value) {
        const key = `data-l10n-${attr}`;
        const source = element.getAttribute(key) ?? value;
        if (!element.hasAttribute(key)) element.setAttribute(key, source);
        const rendered = language === 'hi' ? translate(source) : source;
        if (value !== rendered) element.setAttribute(attr, rendered);
      }
    }
    for (const child of Array.from(node.childNodes)) visit(child);
  };
  visit(root);
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('ke_language') === 'hi' ? 'hi' : 'en');
  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
    applyTranslations(document.body, language, translationCache);
    const observer = new MutationObserver((records) => {
      observer.disconnect();
      for (const record of records) {
        if (record.type === 'characterData') applyTranslations(record.target, language, translationCache);
        else record.addedNodes.forEach((node) => applyTranslations(node, language, translationCache));
      }
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);
  const value = useMemo(() => ({
    language,
    toggleLanguage: () => setLanguage((current) => {
      const next = current === 'en' ? 'hi' : 'en';
      localStorage.setItem('ke_language', next);
      return next;
    }),
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
      aria-label={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
      className={`inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors ${compact ? '' : 'min-w-[76px]'}`}
    >
      {language === 'en' ? 'हिंदी' : 'English'}
    </button>
  );
};
