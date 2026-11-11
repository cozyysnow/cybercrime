// CyberCast National Platform - Report & Collaboration Module Dataset
// Ministry of Home Affairs | Indian Cyber Crime Coordination Centre (I4C)

export type OfficerRole = 
  | 'i4c_admin'
  | 'state_nodal'
  | 'district_officer'
  | 'field_investigator'
  | 'bank_liaison';

export interface OfficerProfile {
  id: string;
  name: string;
  rank: string;
  badgeNumber: string;
  department: string;
  state: string;
  district?: string;
  role: OfficerRole;
  roleName: string;
  avatarText: string;
  phone: string;
  email: string;
  preferredLanguage: string;
  assignedCasesCount: number;
}

export const OFFICER_ROLES: Record<OfficerRole, OfficerProfile> = {
  i4c_admin: {
    id: 'OFF-I4C-001',
    name: 'Dr. A. K. Saxena',
    rank: 'Joint Director (Cyber Defense)',
    badgeNumber: 'I4C-DIR-01',
    department: 'Indian Cyber Crime Coordination Centre (I4C), MHA',
    state: 'National Command',
    role: 'i4c_admin',
    roleName: 'I4C Central Admin',
    avatarText: 'AS',
    phone: '+91-11-2309-XXXX',
    email: 'ak.saxena@i4c.gov.in',
    preferredLanguage: 'English',
    assignedCasesCount: 147,
  },
  state_nodal: {
    id: 'OFF-RJ-002',
    name: 'Vikram Rathore, IPS',
    rank: 'Superintendent of Police',
    badgeNumber: 'RJ-SP-204',
    department: 'State Cyber Crime Cell, Rajasthan Police',
    state: 'Rajasthan',
    district: 'Jaipur HQ',
    role: 'state_nodal',
    roleName: 'State Nodal Officer',
    avatarText: 'VR',
    phone: '+91-141-260-XXXX',
    email: 'sp.cyber@rajpolice.gov.in',
    preferredLanguage: 'Hindi',
    assignedCasesCount: 38,
  },
  district_officer: {
    id: 'OFF-JPR-003',
    name: 'Inspector Rajesh Kumar',
    rank: 'Station House Officer (SHO)',
    badgeNumber: 'JPR-CI-889',
    department: 'Jaipur North Cyber Crime Police Station',
    state: 'Rajasthan',
    district: 'Jaipur North',
    role: 'district_officer',
    roleName: 'District Cyber Cell Officer',
    avatarText: 'RK',
    phone: '+91-98290-XXXXX',
    email: 'sho.cyber.jpr@rajpolice.gov.in',
    preferredLanguage: 'Hindi',
    assignedCasesCount: 14,
  },
  field_investigator: {
    id: 'OFF-FLD-004',
    name: 'SI Manoj Meena',
    rank: 'Sub-Inspector / Field Lead',
    badgeNumber: 'JPR-SI-412',
    department: 'Field Rapid Intervention Squad, Sindhi Camp',
    state: 'Rajasthan',
    district: 'Jaipur North',
    role: 'field_investigator',
    roleName: 'Field Investigator / Constable',
    avatarText: 'MM',
    phone: '+91-94140-XXXXX',
    email: 'si.mmeena@rajpolice.gov.in',
    preferredLanguage: 'Hindi',
    assignedCasesCount: 4,
  },
  bank_liaison: {
    id: 'OFF-SBI-005',
    name: 'Priya Nambiar',
    rank: 'Chief Nodal Officer (Fraud Risk)',
    badgeNumber: 'SBI-CFC-91',
    department: 'State Bank of India - Central Fraud Monitoring Cell',
    state: 'National Banking Liaison',
    role: 'bank_liaison',
    roleName: 'Bank / FI Liaison Officer',
    avatarText: 'PN',
    phone: '+91-22-2282-XXXX',
    email: 'cfrc.nodal@sbi.co.in',
    preferredLanguage: 'English',
    assignedCasesCount: 29,
  },
};

export type CaseStatus = 
  | 'NEW'
  | 'AI_ANALYZED'
  | 'ALERT_DISPATCHED'
  | 'UNDER_INVESTIGATION'
  | 'SURVEILLANCE_ACTIVE'
  | 'FUNDS_FROZEN'
  | 'ARREST_MADE'
  | 'CASE_RESOLVED'
  | 'CLOSED';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface MoneyTrailNode {
  id: string;
  label: string;
  type: 'victim' | 'mule' | 'atm' | 'gateway';
  bank: string;
  accountMasked: string;
  amount: number;
  timestamp: string;
  location: string;
  holderName?: string;
  status: 'Active' | 'Frozen' | 'Drained' | 'Withdrawn';
  freezeStatus: 'Pending' | 'Approved' | 'Rejected' | 'Executed';
}

export interface CaseEntity {
  id: string;
  ncrpAckNumber: string;
  registeredAt: string;
  fraudType: string;
  totalAmount: number;
  recoveredAmount: number;
  victimState: string;
  victimDistrict: string;
  suspectedWithdrawalState: string;
  suspectedWithdrawalCity: string;
  suspectedWithdrawalZone: string;
  status: CaseStatus;
  priority: PriorityLevel;
  assignedOfficerId: string;
  assignedOfficerName: string;
  lastUpdated: string;
  linkedCasesCount: number;
  sourceOfComplaint: 'NCRP Portal' | 'Helpline 1930' | 'Bank Alert' | 'Police Station Walk-in';
  
  // Victim Details
  victim: {
    name: string;
    maskedName: string;
    age: number;
    gender: string;
    phoneMasked: string;
    bankName: string;
    accountMasked: string;
    summaryText: string;
  };

  // AI Predictive Intelligence
  aiSummary: string;
  predictedZone: string;
  predictedTimeWindow: string;
  confidenceScore: number;
  suspectedGang: string;
  
  // Linked Indicators
  linkedMuleAccounts: string[];
  linkedPhoneNumbers: string[];
  linkedIMEIs: string[];

  // Graph and Log
  moneyTrail: MoneyTrailNode[];
  actionLog: {
    timestamp: string;
    officerName: string;
    role: string;
    action: string;
    location?: string;
    outcome: string;
  }[];

  // Blockchain & Section 63 BSA 2023 Proof
  blockchainProof?: {
    txHash: string;
    blockNumber: number;
    certId: string;
    anchoredAt: string;
    manifestCid?: string;
    manifestHash?: string;
  };
}

export const CASES_DATA: CaseEntity[] = [
  {
    id: 'CY2026-MH-44521',
    ncrpAckNumber: 'NCRP-2026-0905-8812',
    registeredAt: '05 Sept 2026, 11:42 IST',
    fraudType: 'KYC Fraud / SIM Swap',
    totalAmount: 450000,
    recoveredAmount: 185000,
    victimState: 'Maharashtra',
    victimDistrict: 'Mumbai Suburban',
    suspectedWithdrawalState: 'Rajasthan',
    suspectedWithdrawalCity: 'Jaipur',
    suspectedWithdrawalZone: 'Sindhi Camp ATM Cluster',
    status: 'SURVEILLANCE_ACTIVE',
    priority: 'Critical',
    assignedOfficerId: 'OFF-JPR-003',
    assignedOfficerName: 'Insp. Rajesh Kumar',
    lastUpdated: '10 mins ago',
    linkedCasesCount: 4,
    sourceOfComplaint: 'Helpline 1930',
    blockchainProof: {
      txHash: '0x8f2c3a1e9b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
      blockNumber: 14892015,
      certId: 'BSA-63-2026-MH-8812',
      anchoredAt: '05 Sept 2026, 11:42:19 IST',
      manifestCid: 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
      manifestHash: '9e1a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a',
    },
    victim: {
      name: 'Sunita Deshmukh',
      maskedName: 'S***** D*******',
      age: 49,
      gender: 'Female',
      phoneMasked: '+91-98200-XXXXX',
      bankName: 'HDFC Bank',
      accountMasked: 'HDFC-XXXX-8921',
      summaryText: 'Victim received SMS regarding electricity KYC suspension. Followed link to download QuickSupport APK. Total ₹4,50,000 debited in 3 swift RTGS/IMPS transactions within 14 minutes.',
    },
    aiSummary: 'High-confidence correlation with Bharatpur-Jaipur syndicates. Funds diverted into 2 primary mule accounts in Delhi and Rajasthan. Predicted physical cash withdrawal at Sindhi Camp ATMs between 14:00 - 16:30 IST today.',
    predictedZone: 'Sindhi Camp, Jaipur',
    predictedTimeWindow: 'Today 14:00 - 16:30 IST',
    confidenceScore: 92,
    suspectedGang: 'Mewat Sector-4 Syndicate',
    linkedMuleAccounts: ['SBI-XXXX-4491 (Jaipur)', 'PNB-XXXX-1102 (Alwar)', 'HDFC-XXXX-7729 (Delhi)'],
    linkedPhoneNumbers: ['+91-98765-43210', '+91-97854-11223', '+91-88221-99887'],
    linkedIMEIs: ['864920048192019', '359102847192847'],
    moneyTrail: [
      {
        id: 'node-1',
        label: 'Victim Account',
        type: 'victim',
        bank: 'HDFC Bank',
        accountMasked: 'HDFC-XXXX-8921',
        amount: 450000,
        timestamp: '11:28 IST',
        location: 'Andheri, Mumbai',
        holderName: 'Sunita Deshmukh',
        status: 'Drained',
        freezeStatus: 'Executed',
      },
      {
        id: 'node-2',
        label: 'Mule Layer 1',
        type: 'mule',
        bank: 'State Bank of India',
        accountMasked: 'SBI-XXXX-4491',
        amount: 265000,
        timestamp: '11:34 IST',
        location: 'Sindhi Camp, Jaipur',
        holderName: 'Ramesh K. (Mule)',
        status: 'Active',
        freezeStatus: 'Approved',
      },
      {
        id: 'node-3',
        label: 'Mule Layer 1 (Secondary)',
        type: 'mule',
        bank: 'Punjab National Bank',
        accountMasked: 'PNB-XXXX-1102',
        amount: 185000,
        timestamp: '11:37 IST',
        location: 'Alwar, Rajasthan',
        holderName: 'Mohd. Salim',
        status: 'Frozen',
        freezeStatus: 'Executed',
      },
      {
        id: 'node-4',
        label: 'Predicted ATM Terminal',
        type: 'atm',
        bank: 'SBI ATM Terminal #RJ-4421',
        accountMasked: 'ATM-SBI-014',
        amount: 265000,
        timestamp: '14:15 IST (Est.)',
        location: 'Station Road, Jaipur',
        status: 'Active',
        freezeStatus: 'Pending',
      },
    ],
    actionLog: [
      {
        timestamp: '11:42 IST',
        officerName: 'System (NCRP 1930)',
        role: 'Automated Ingestion',
        action: 'Complaint ingested from Maharashtra Helpline 1930',
        outcome: 'Case registered, fraud taxonomy classified as KYC SIM-Swap',
      },
      {
        timestamp: '11:45 IST',
        officerName: 'CyberCast AI Engine',
        role: 'AI Model v2.4',
        action: 'Hotspot prediction generated: Sindhi Camp ATMs, Jaipur (92% Conf.)',
        outcome: 'Corridor identified: Mumbai → Jaipur transit. Alert generated.',
      },
      {
        timestamp: '11:48 IST',
        officerName: 'Vikram Rathore, IPS',
        role: 'State Nodal Officer',
        action: 'Inter-state alert acknowledged and assigned to Jaipur North Cyber Cell',
        outcome: 'Forwarded to Inspector Rajesh Kumar for field intervention',
      },
      {
        timestamp: '12:05 IST',
        officerName: 'Insp. Rajesh Kumar',
        role: 'District Cyber Cell Officer',
        action: 'Dispatched 2 field officers (SI Manoj Meena) to Sindhi Camp',
        location: 'Sindhi Camp PS',
        outcome: 'Surveillance perimeter locked at 12:15 IST',
      },
      {
        timestamp: '12:20 IST',
        officerName: 'Priya Nambiar',
        role: 'Bank Liaison (SBI)',
        action: 'Dispatched CFCFRMS freeze request on PNB-XXXX-1102 and SBI-XXXX-4491',
        outcome: '₹1,85,000 successfully frozen in PNB account; SBI account under hold',
      },
    ],
  },
  {
    id: 'CY2026-UP-44519',
    ncrpAckNumber: 'NCRP-2026-0905-7994',
    registeredAt: '05 Sept 2026, 10:15 IST',
    fraudType: 'Investment Scam / Task Fraud',
    totalAmount: 1280000,
    recoveredAmount: 750000,
    victimState: 'Uttar Pradesh',
    victimDistrict: 'Lucknow',
    suspectedWithdrawalState: 'Haryana',
    suspectedWithdrawalCity: 'Nuh (Mewat)',
    suspectedWithdrawalZone: 'Tauru Road ATM Corridor',
    status: 'FUNDS_FROZEN',
    priority: 'Critical',
    assignedOfficerId: 'OFF-I4C-001',
    assignedOfficerName: 'Dr. A. K. Saxena',
    lastUpdated: '25 mins ago',
    linkedCasesCount: 9,
    sourceOfComplaint: 'NCRP Portal',
    victim: {
      name: 'Ashok Srivastava',
      maskedName: 'A***** S*********',
      age: 36,
      gender: 'Male',
      phoneMasked: '+91-94520-XXXXX',
      bankName: 'ICICI Bank',
      accountMasked: 'ICICI-XXXX-3341',
      summaryText: 'Victim lured through Telegram group promising 300% return on crypto algorithmic trading. Transferred ₹12.8 Lakhs across 4 payment gateway vouchers.',
    },
    aiSummary: 'Organized cross-state investment syndicate spanning Lucknow, Gurugram, and Mewat. ₹7.5 Lakhs blocked before withdrawal. Remaining funds routed to rural POS terminals.',
    predictedZone: 'Tauru, Mewat',
    predictedTimeWindow: 'Today 13:00 - 15:30 IST',
    confidenceScore: 88,
    suspectedGang: 'Nuh Cyber Collective',
    linkedMuleAccounts: ['Canara-XXXX-8910 (Nuh)', 'Axis-XXXX-5521 (Gurugram)'],
    linkedPhoneNumbers: ['+91-98120-XXXXX', '+91-96500-XXXXX'],
    linkedIMEIs: ['867829012398471'],
    moneyTrail: [
      {
        id: 'node-201',
        label: 'Victim ICICI Account',
        type: 'victim',
        bank: 'ICICI Bank',
        accountMasked: 'ICICI-XXXX-3341',
        amount: 1280000,
        timestamp: '09:50 IST',
        location: 'Hazratganj, Lucknow',
        status: 'Drained',
        freezeStatus: 'Executed',
      },
      {
        id: 'node-202',
        label: 'Payment Gateway Escrow',
        type: 'gateway',
        bank: 'Razorpay / Escrow',
        accountMasked: 'GW-ESC-9081',
        amount: 750000,
        timestamp: '10:02 IST',
        location: 'Bengaluru Cloud',
        status: 'Frozen',
        freezeStatus: 'Executed',
      },
      {
        id: 'node-203',
        label: 'Mule Layer 2',
        type: 'mule',
        bank: 'Canara Bank',
        accountMasked: 'CNRB-XXXX-8910',
        amount: 530000,
        timestamp: '10:20 IST',
        location: 'Nuh, Haryana',
        status: 'Active',
        freezeStatus: 'Approved',
      },
    ],
    actionLog: [
      {
        timestamp: '10:15 IST',
        officerName: 'System (NCRP)',
        role: 'Automated Ingestion',
        action: 'High-value complaint received (>₹10 Lakhs)',
        outcome: 'Priority automatically upgraded to Critical',
      },
      {
        timestamp: '10:30 IST',
        officerName: 'Dr. A. K. Saxena',
        role: 'I4C Central Admin',
        action: 'Initiated multi-agency freeze via CFCFRMS gateway',
        outcome: '₹7,50,000 frozen at merchant escrow stage',
      },
    ],
  },
  {
    id: 'CY2026-DL-44502',
    ncrpAckNumber: 'NCRP-2026-0905-6541',
    registeredAt: '05 Sept 2026, 09:10 IST',
    fraudType: 'Loan App Harassment & Sextortion',
    totalAmount: 240000,
    recoveredAmount: 240000,
    victimState: 'Delhi',
    victimDistrict: 'East Delhi',
    suspectedWithdrawalState: 'Jharkhand',
    suspectedWithdrawalCity: 'Jamtara',
    suspectedWithdrawalZone: 'Karmatanr Rural Cluster',
    status: 'ARREST_MADE',
    priority: 'High',
    assignedOfficerId: 'OFF-I4C-001',
    assignedOfficerName: 'Dr. A. K. Saxena',
    lastUpdated: '1 hour ago',
    linkedCasesCount: 14,
    sourceOfComplaint: 'Police Station Walk-in',
    victim: {
      name: 'Rohan Verma',
      maskedName: 'R**** V****',
      age: 27,
      gender: 'Male',
      phoneMasked: '+91-99110-XXXXX',
      bankName: 'Axis Bank',
      accountMasked: 'AXIS-XXXX-9901',
      summaryText: 'Victim blackmailed with morphed photographs after taking ₹10,000 instant loan on CashQuick App.',
    },
    aiSummary: 'Classic Jamtara-Karmatanr syndicate. Suspect spotted withdrawing at CSP counter; local police intercepted operative with 18 ATM cards and 11 SIM cards.',
    predictedZone: 'Karmatanr, Jamtara',
    predictedTimeWindow: '05 Sept 10:00 - 12:00 IST',
    confidenceScore: 95,
    suspectedGang: 'Karmatanr Module 3',
    linkedMuleAccounts: ['BOB-XXXX-0012 (Jamtara)'],
    linkedPhoneNumbers: ['+91-70041-XXXXX'],
    linkedIMEIs: ['359910294819201'],
    moneyTrail: [],
    actionLog: [
      {
        timestamp: '09:10 IST',
        officerName: 'East Delhi Cyber Cell',
        role: 'District Officer',
        action: 'FIR lodged under Sec 67A IT Act and Sec 384 IPC',
        outcome: 'Case transferred to National Cyber Threat Registry',
      },
      {
        timestamp: '11:45 IST',
        officerName: 'Jamtara District Police',
        role: 'Field Squad',
        action: 'Suspect intercepted at CSP terminal during withdrawal attempt',
        location: 'Karmatanr Chowk',
        outcome: 'Suspect detained, ₹2,40,000 cash recovered + 18 ATM cards seized',
      },
    ],
  },
  {
    id: 'CY2026-KA-44498',
    ncrpAckNumber: 'NCRP-2026-0904-9120',
    registeredAt: '04 Sept 2026, 18:30 IST',
    fraudType: 'UPI Phishing / QR Code Scam',
    totalAmount: 85000,
    recoveredAmount: 45000,
    victimState: 'Karnataka',
    victimDistrict: 'Bengaluru Urban',
    suspectedWithdrawalState: 'Madhya Pradesh',
    suspectedWithdrawalCity: 'Indore',
    suspectedWithdrawalZone: 'Indore Railway Station ATMs',
    status: 'UNDER_INVESTIGATION',
    priority: 'Medium',
    assignedOfficerId: 'OFF-I4C-001',
    assignedOfficerName: 'Dr. A. K. Saxena',
    lastUpdated: '3 hours ago',
    linkedCasesCount: 2,
    sourceOfComplaint: 'NCRP Portal',
    victim: {
      name: 'Karthik Raman',
      maskedName: 'K****** R****',
      age: 31,
      gender: 'Male',
      phoneMasked: '+91-98450-XXXXX',
      bankName: 'Kotak Mahindra Bank',
      accountMasked: 'KKBK-XXXX-4102',
      summaryText: 'Scammer sent "Receive Money" QR code on OLX for sofa sale. ₹85,000 debited instead of credit.',
    },
    aiSummary: 'Indore transit node detected. Pattern matches 3 previous OLX scams with identical UPI VPA handle.',
    predictedZone: 'Indore Railway Station, MP',
    predictedTimeWindow: '05 Sept 16:00 - 19:00 IST',
    confidenceScore: 76,
    suspectedGang: 'Indore Transit Node',
    linkedMuleAccounts: ['Paytm Payments Bank-XXXX-3312'],
    linkedPhoneNumbers: ['+91-88190-XXXXX'],
    linkedIMEIs: ['864902819203918'],
    moneyTrail: [],
    actionLog: [],
  },
  {
    id: 'CY2026-WB-44485',
    ncrpAckNumber: 'NCRP-2026-0904-8112',
    registeredAt: '04 Sept 2026, 15:45 IST',
    fraudType: 'Digital Arrest / FedEx Impersonation',
    totalAmount: 1850000,
    recoveredAmount: 1200000,
    victimState: 'West Bengal',
    victimDistrict: 'Kolkata',
    suspectedWithdrawalState: 'Bihar',
    suspectedWithdrawalCity: 'Patna',
    suspectedWithdrawalZone: 'Gandhi Maidan Banking Enclave',
    status: 'SURVEILLANCE_ACTIVE',
    priority: 'Critical',
    assignedOfficerId: 'OFF-I4C-001',
    assignedOfficerName: 'Dr. A. K. Saxena',
    lastUpdated: '4 hours ago',
    linkedCasesCount: 7,
    sourceOfComplaint: 'Helpline 1930',
    victim: {
      name: 'Prof. Debabrata Roy',
      maskedName: 'P***. D******** R**',
      age: 64,
      gender: 'Male',
      phoneMasked: '+91-98300-XXXXX',
      bankName: 'State Bank of India',
      accountMasked: 'SBI-XXXX-5521',
      summaryText: 'Victim put on Skype "Digital Arrest" for 36 hours by fraudsters posing as Mumbai Crime Branch and CBI. Transferred life savings of ₹18.5 Lakhs.',
    },
    aiSummary: 'Sophisticated international cartel operating via Patna mule rings. Fast fund dispersal into 6 tier-2 accounts.',
    predictedZone: 'Gandhi Maidan, Patna',
    predictedTimeWindow: '05 Sept 14:00 - 17:00 IST',
    confidenceScore: 89,
    suspectedGang: 'Cross-Border Digital Arrest Cartel',
    linkedMuleAccounts: ['BOI-XXXX-9901', 'CBI-XXXX-3341'],
    linkedPhoneNumbers: ['+91-90060-XXXXX'],
    linkedIMEIs: ['864901920391823'],
    moneyTrail: [],
    actionLog: [],
  },
  {
    id: 'CY2026-HR-44472',
    ncrpAckNumber: 'NCRP-2026-0904-7102',
    registeredAt: '04 Sept 2026, 12:20 IST',
    fraudType: 'Electricity Bill Disconnection SMS',
    totalAmount: 120000,
    recoveredAmount: 120000,
    victimState: 'Haryana',
    victimDistrict: 'Gurugram',
    suspectedWithdrawalState: 'Rajasthan',
    suspectedWithdrawalCity: 'Bharatpur',
    suspectedWithdrawalZone: 'Kaman Rural ATM Zone',
    status: 'FUNDS_FROZEN',
    priority: 'High',
    assignedOfficerId: 'OFF-RJ-002',
    assignedOfficerName: 'Vikram Rathore, IPS',
    lastUpdated: '5 hours ago',
    linkedCasesCount: 5,
    sourceOfComplaint: 'NCRP Portal',
    victim: {
      name: 'Suresh Chand',
      maskedName: 'S***** C****',
      age: 58,
      gender: 'Male',
      phoneMasked: '+91-98100-XXXXX',
      bankName: 'Punjab National Bank',
      accountMasked: 'PNB-XXXX-0912',
      summaryText: 'SMS stating power will be disconnected at 9:30 PM. Contacted rogue executive who sent teamviewer link.',
    },
    aiSummary: 'Bharatpur border network. 100% funds frozen within 22 minutes via CFCFRMS automated nodal hook.',
    predictedZone: 'Kaman, Bharatpur',
    predictedTimeWindow: 'Completed',
    confidenceScore: 91,
    suspectedGang: 'Mewat-Bharatpur Border Ring',
    linkedMuleAccounts: ['Union Bank-XXXX-4401'],
    linkedPhoneNumbers: ['+91-97840-XXXXX'],
    linkedIMEIs: ['359902819203918'],
    moneyTrail: [],
    actionLog: [],
  },
  {
    id: 'CY2026-GJ-44441',
    ncrpAckNumber: 'NCRP-2026-0903-5120',
    registeredAt: '03 Sept 2026, 14:10 IST',
    fraudType: 'Fake Institutional Stock Advisory',
    totalAmount: 2400000,
    recoveredAmount: 950000,
    victimState: 'Gujarat',
    victimDistrict: 'Ahmedabad',
    suspectedWithdrawalState: 'Gujarat',
    suspectedWithdrawalCity: 'Surat',
    suspectedWithdrawalZone: 'Varachha Diamond Market ATMs',
    status: 'UNDER_INVESTIGATION',
    priority: 'Critical',
    assignedOfficerId: 'OFF-I4C-001',
    assignedOfficerName: 'Dr. A. K. Saxena',
    lastUpdated: '1 day ago',
    linkedCasesCount: 11,
    sourceOfComplaint: 'NCRP Portal',
    victim: {
      name: 'Pankaj Shah',
      maskedName: 'P***** S***',
      age: 52,
      gender: 'Male',
      phoneMasked: '+91-98250-XXXXX',
      bankName: 'Bank of Baroda',
      accountMasked: 'BOB-XXXX-7789',
      summaryText: 'Victim added to VIP institutional stock advisory club. Fraudulent app simulated 450% profits, demanded ₹24 Lakhs margin before withdrawal.',
    },
    aiSummary: 'High-value shell company network laundering money via diamond trading firm accounts.',
    predictedZone: 'Varachha, Surat',
    predictedTimeWindow: '06 Sept 11:00 - 14:00 IST',
    confidenceScore: 84,
    suspectedGang: 'Surat Havala-Crypto Cluster',
    linkedMuleAccounts: ['Yes Bank-XXXX-9012', 'Federal Bank-XXXX-3321'],
    linkedPhoneNumbers: ['+91-99240-XXXXX'],
    linkedIMEIs: ['864902819283749'],
    moneyTrail: [],
    actionLog: [],
  },
  {
    id: 'CY2026-TN-44455',
    ncrpAckNumber: 'NCRP-2026-0903-9981',
    registeredAt: '03 Sept 2026, 16:50 IST',
    fraudType: 'Credit Card Reward Points OTP',
    totalAmount: 95000,
    recoveredAmount: 95000,
    victimState: 'Tamil Nadu',
    victimDistrict: 'Chennai',
    suspectedWithdrawalState: 'Tamil Nadu',
    suspectedWithdrawalCity: 'Coimbatore',
    suspectedWithdrawalZone: 'RS Puram Commercial ATM Ring',
    status: 'CASE_RESOLVED',
    priority: 'Medium',
    assignedOfficerId: 'OFF-I4C-001',
    assignedOfficerName: 'Dr. A. K. Saxena',
    lastUpdated: '2 days ago',
    linkedCasesCount: 1,
    sourceOfComplaint: 'Helpline 1930',
    victim: {
      name: 'Meenakshi Sundaram',
      maskedName: 'M******** S*******',
      age: 42,
      gender: 'Female',
      phoneMasked: '+91-98410-XXXXX',
      bankName: 'Indian Overseas Bank',
      accountMasked: 'IOB-XXXX-1120',
      summaryText: 'Victim asked to redeem ₹9,500 credit card cashback points on malicious portal.',
    },
    aiSummary: 'Local Coimbatore mule account flagged and frozen in real time. Total ₹95,000 returned to victim.',
    predictedZone: 'RS Puram, Coimbatore',
    predictedTimeWindow: 'Completed',
    confidenceScore: 94,
    suspectedGang: 'TN Local Mule Operatives',
    linkedMuleAccounts: ['IOB-XXXX-4421'],
    linkedPhoneNumbers: ['+91-94430-XXXXX'],
    linkedIMEIs: ['359902819284729'],
    moneyTrail: [],
    actionLog: [],
  },
];

export interface EvidenceItem {
  id: string;
  caseId: string;
  title: string;
  category: 'Communication' | 'Financial' | 'Identity' | 'Device' | 'Surveillance' | 'Legal' | 'Forensic' | 'Forensic / AI Intelligence Report';
  type: 'image' | 'pdf' | 'audio' | 'video' | 'json';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadingOfficerId: string;
  deviceUsed: string;
  gpsCoordinates: string;
  sha256Hash: string;
  relevance: 'Primary' | 'Supporting' | 'Background';
  source: 'Victim' | 'Bank' | 'Police' | 'AI-detected' | 'CCTV' | 'Social Media';
  confidentiality: 'Open' | 'Restricted' | 'Top Secret';
  ocrExtractedText?: string;
  translatedText?: string;
  detectedLanguage?: string;
  previewUrl?: string;
  chainOfCustody: {
    timestamp: string;
    officerName: string;
    action: string;
    purpose: string;
    blockNumber?: number;
    txHash?: string;
    digitalSignature?: string;
  }[];
  // Blockchain & BSA 2023 Forensic Fields
  blockchainTxHash?: string;
  polygonBlockNumber?: number;
  ipfsCid?: string;
  anchoredAt?: string;
  bsa63CertificateId?: string;
  ledgerStatus: 'ANCHORED' | 'PENDING' | 'LOCAL';
  // PaddleOCR & Dual-Layer Compound Forensic Fields
  compoundHash?: string;
  rawFileSha256?: string;
  ocrTextSha256?: string;
  ocrConfidence?: number;
  ocrEntities?: {
    phone_numbers?: string[];
    bank_accounts?: string[];
    upi_ids?: string[];
    ifsc_codes?: string[];
    apks_detected?: string[];
    urls_detected?: string[];
    urgency_keywords?: string[];
    utr_numbers?: string[];
  };
  ocrModelVersion?: string;
}

export const EVIDENCE_DATA: EvidenceItem[] = [
  {
    id: 'EVD-2026-901',
    caseId: 'CY2026-MH-44521',
    title: 'WhatsApp Threat & QuickSupport APK Screenshot',
    category: 'Communication',
    type: 'image',
    fileName: 'whatsapp_fraud_chat_01.png',
    fileSize: '1.4 MB',
    uploadedAt: '05 Sept 2026, 11:55 IST',
    uploadedBy: 'Insp. Rajesh Kumar (JPR-CI-889)',
    uploadingOfficerId: 'OFF-JPR-003',
    deviceUsed: 'Secure Toughbook TB-90',
    gpsCoordinates: '26.9200° N, 75.7950° E (Jaipur HQ)',
    sha256Hash: '9e1a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a',
    relevance: 'Primary',
    source: 'Victim',
    confidentiality: 'Restricted',
    detectedLanguage: 'Hindi / English (Hinglish)',
    ocrExtractedText: 'प्रिय उपभोक्ता, आपका बिजली कनेक्शन आज रात 9:30 बजे काट दिया जाएगा। तुरंत बिजली अधिकारी 98765-XXXXX पर संपर्क करें। QuickSupport APK डाउनलोड करें।',
    translatedText: 'Dear Consumer, your electricity connection will be disconnected tonight at 9:30 PM. Immediately contact electricity officer at 98765-XXXXX. Download QuickSupport APK.',
    blockchainTxHash: '0x8f2c3a1e9b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    polygonBlockNumber: 14892014,
    ipfsCid: 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
    anchoredAt: '2026-09-05T06:26:12.000Z',
    bsa63CertificateId: 'BSA-63-2026-RAJ-9182',
    ledgerStatus: 'ANCHORED',
    rawFileSha256: '9e1a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a',
    compoundHash: '7d91e8b2c4f6a1e3d5b7c9e0f2a4b6c8d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a0',
    ocrConfidence: 0.964,
    ocrModelVersion: 'PaddleOCR v2.8',
    ocrEntities: {
      phone_numbers: ['98765-XXXXX'],
      apks_detected: ['QuickSupport.apk'],
      urgency_keywords: ['काट दिया जाएगा', 'तुरंत', 'बिजली कनेक्शन'],
    },
    chainOfCustody: [
      {
        timestamp: '11:55 IST',
        officerName: 'Insp. Rajesh Kumar',
        action: 'Evidence Ingested & Hash Calculated',
        purpose: 'Case file creation and forensic preservation',
        blockNumber: 14892014,
        txHash: '0x8f2c3a1e9b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
        digitalSignature: '0x3c7e1892fa...8b21e0 (Secured by MHA HSM)',
      },
      {
        timestamp: '12:05 IST',
        officerName: 'SI Manoj Meena',
        action: 'Viewed on Field Device',
        purpose: 'Phone number verification before patrol deployment',
        blockNumber: 14892025,
        txHash: '0x12a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3',
        digitalSignature: '0x7a8b9c0d1e...4f5a6b',
      },
      {
        timestamp: '12:30 IST',
        officerName: 'Dr. A. K. Saxena',
        action: 'Evidence Audit Verification',
        purpose: 'National syndicate correlation query',
        blockNumber: 14892050,
        txHash: '0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
        digitalSignature: '0x9e0f1a2b3c...6d7e8f',
      },
    ],
  },
  {
    id: 'EVD-2026-902',
    caseId: 'CY2026-MH-44521',
    title: 'CCTV Screen Frame - Suspect at SBI Sindhi Camp ATM',
    category: 'Surveillance',
    type: 'image',
    fileName: 'cctv_sbi_sindhicamp_atm.png',
    fileSize: '2.8 MB',
    uploadedAt: '05 Sept 2026, 12:40 IST',
    uploadedBy: 'SI Manoj Meena (JPR-SI-412)',
    uploadingOfficerId: 'OFF-FLD-004',
    deviceUsed: 'Motorola Field Mobile MDT-12',
    gpsCoordinates: '26.9196° N, 75.7942° E (Sindhi Camp ATM)',
    sha256Hash: 'f4b2c1d0e9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2',
    relevance: 'Primary',
    source: 'CCTV',
    confidentiality: 'Top Secret',
    ocrExtractedText: 'ATM CCTV CAM 02 - 05/09/2026 12:34:11 IST - SBI SINDHI CAMP BR - SUSPECT MALE BLACK HOODIE BLUE JEANS',
    blockchainTxHash: '0x7e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d',
    polygonBlockNumber: 14892188,
    ipfsCid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    anchoredAt: '2026-09-05T07:11:45.000Z',
    bsa63CertificateId: 'BSA-63-2026-RAJ-9183',
    ledgerStatus: 'ANCHORED',
    rawFileSha256: 'f4b2c1d0e9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2',
    compoundHash: '8e02f9a3b5c7d1e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2',
    ocrConfidence: 0.942,
    ocrModelVersion: 'PaddleOCR v2.8',
    ocrEntities: {
      phone_numbers: [],
      bank_accounts: [],
      urgency_keywords: [],
    },
    chainOfCustody: [
      {
        timestamp: '12:40 IST',
        officerName: 'SI Manoj Meena',
        action: 'Uploaded from Field Terminal & Anchored to Ledger',
        purpose: 'Real-time suspect identification broadcast',
        blockNumber: 14892188,
        txHash: '0x7e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d',
        digitalSignature: '0x9a8f7e6d5c...1e0d9c',
      },
    ],
  },
  {
    id: 'EVD-2026-903',
    caseId: 'CY2026-MH-44521',
    title: 'Bank Statement & Transaction Receipt Flow',
    category: 'Financial',
    type: 'pdf',
    fileName: 'hdfc_freeze_mandate_44521.pdf',
    fileSize: '840 KB',
    uploadedAt: '05 Sept 2026, 12:15 IST',
    uploadedBy: 'Priya Nambiar (SBI-CFC-91)',
    uploadingOfficerId: 'OFF-SBI-005',
    deviceUsed: 'SBI CFCFRMS Portal Terminal',
    gpsCoordinates: '18.9220° N, 72.8340° E (Mumbai Nariman Point)',
    sha256Hash: 'c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
    relevance: 'Primary',
    source: 'Bank',
    confidentiality: 'Restricted',
    ocrExtractedText: 'CFCFRMS CONFIRMATION - UTR: HDFCR5202609050019284 - BENEFICIARY: RAMESH KUMAR SBI RJ - STATUS: ACCOUNT UNDER 24H LIEN',
    blockchainTxHash: '0x4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
    polygonBlockNumber: 14892245,
    ipfsCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    anchoredAt: '2026-09-05T06:46:20.000Z',
    bsa63CertificateId: 'BSA-63-2026-MH-4421',
    ledgerStatus: 'ANCHORED',
    rawFileSha256: 'c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
    compoundHash: '9f13a0b4c6d8e2f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3',
    ocrConfidence: 0.978,
    ocrModelVersion: 'PaddleOCR v2.8',
    ocrEntities: {
      bank_accounts: ['38920192831'],
      ifsc_codes: ['SBIN0001234'],
      utr_numbers: ['HDFCR5202609050019284'],
      urgency_keywords: ['LIEN'],
    },
    chainOfCustody: [
      {
        timestamp: '12:15 IST',
        officerName: 'Priya Nambiar',
        action: 'Uploaded Statutory Freeze Notice & Mined On-Chain',
        purpose: 'Section 91 CrPC / Section 63 BSA compliance documentation',
        blockNumber: 14892245,
        txHash: '0x4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
        digitalSignature: '0x2c3d4e5f6a...e1f2a3',
      },
    ],
  },
  {
    id: 'EVD-2026-904',
    caseId: 'CY2026-MH-44521',
    title: 'First Information Report (FIR Copy #412/2026)',
    category: 'Legal',
    type: 'pdf',
    fileName: 'fir_412_2026_mumbai_jaipur.pdf',
    fileSize: '3.1 MB',
    uploadedAt: '05 Sept 2026, 12:00 IST',
    uploadedBy: 'Insp. Rajesh Kumar (JPR-CI-889)',
    uploadingOfficerId: 'OFF-JPR-003',
    deviceUsed: 'Jaipur HQ Terminal 04',
    gpsCoordinates: '26.9200° N, 75.7950° E',
    sha256Hash: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
    relevance: 'Primary',
    source: 'Police',
    confidentiality: 'Restricted',
    blockchainTxHash: '0x3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b',
    polygonBlockNumber: 14892090,
    ipfsCid: 'QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdukVaTe7n2ZSQxK',
    anchoredAt: '2026-09-05T06:31:00.000Z',
    bsa63CertificateId: 'BSA-63-2026-RAJ-9180',
    ledgerStatus: 'ANCHORED',
    rawFileSha256: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
    compoundHash: 'a024b1c5d7e9f3a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4',
    ocrConfidence: 0.985,
    ocrModelVersion: 'PaddleOCR v2.8',
    chainOfCustody: [
      {
        timestamp: '12:00 IST',
        officerName: 'Insp. Rajesh Kumar',
        action: 'FIR Document Scanned, Registered & Anchored',
        purpose: 'Statutory Case File Evidence under BSA Section 63',
        blockNumber: 14892090,
        txHash: '0x3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b',
        digitalSignature: '0x5a6b7c8d9e...3c4d5e',
      },
    ],
  },
];

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRank: string;
  senderState: string;
  channelId: string;
  timestamp: string;
  originalText: string;
  originalLanguage: string;
  translatedText?: string;
  translatedLanguage?: string;
  translationConfidence?: number;
  type: 'text' | 'file' | 'voice' | 'location' | 'system_alert';
  attachments?: {
    name: string;
    type: string;
    size: string;
    url?: string;
  }[];
  voiceDuration?: string;
  voiceTranscript?: string;
  locationData?: {
    name: string;
    coords: [number, number];
  };
  reactions: { emoji: string; count: number; users: string[] }[];
  isPinned?: boolean;
}

export const CHAT_CHANNELS = [
  {
    id: 'case-44521',
    name: 'Case CY-44521: Mumbai → Jaipur Inter-State Trail',
    type: 'case',
    unread: 2,
    stateTags: ['MH', 'RJ', 'I4C'],
    participantsCount: 5,
  },
  {
    id: 'group-mewat-ring',
    name: 'Task Force: Operation Mewat Cyber Ring',
    type: 'group',
    unread: 4,
    stateTags: ['RJ', 'HR', 'UP', 'I4C'],
    participantsCount: 14,
  },
  {
    id: 'dm-sp-vikram',
    name: 'SP Vikram Rathore (Rajasthan Nodal)',
    type: 'dm',
    unread: 0,
    stateTags: ['RJ'],
    participantsCount: 2,
  },
  {
    id: 'dm-bank-nodal',
    name: 'Priya Nambiar (SBI Nodal Liaison)',
    type: 'dm',
    unread: 1,
    stateTags: ['SBI'],
    participantsCount: 2,
  },
  {
    id: 'broadcast-national',
    name: 'I4C National Threat Directives [BROADCAST]',
    type: 'broadcast',
    unread: 0,
    stateTags: ['PAN-INDIA'],
    participantsCount: 320,
  },
];

export const CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  'case-44521': [
    {
      id: 'msg-1',
      senderId: 'OFF-I4C-001',
      senderName: 'Dr. A. K. Saxena',
      senderRank: 'Joint Director (I4C)',
      senderState: 'National Command',
      channelId: 'case-44521',
      timestamp: '11:50 IST',
      originalText: 'Urgent coordination alert for Case CY-44521. Stolen amount ₹4.5 Lakhs from Mumbai victim. AI prediction indicates withdrawal cluster at Sindhi Camp Jaipur within next 2 hours.',
      originalLanguage: 'English',
      translatedText: 'केस CY-44521 के लिए तत्काल समन्वय अलर्ट। मुंबई के पीड़ित से चोरी की गई राशि ₹4.5 लाख। एआई भविष्यवाणी अगले 2 घंटों के भीतर सिंधी कैंप जयपुर में निकासी क्लस्टर का संकेत देती है।',
      translatedLanguage: 'Hindi',
      translationConfidence: 98,
      type: 'text',
      reactions: [
        { emoji: '✅', count: 3, users: ['VR', 'RK', 'PN'] },
        { emoji: '⚠️', count: 2, users: ['VR', 'MM'] },
      ],
      isPinned: true,
    },
    {
      id: 'msg-2',
      senderId: 'OFF-RJ-002',
      senderName: 'Vikram Rathore, IPS',
      senderRank: 'SP Cyber Cell',
      senderState: 'Rajasthan',
      channelId: 'case-44521',
      timestamp: '11:54 IST',
      originalText: 'संदेश प्राप्त हुआ। मैंने जयपुर नॉर्थ के एसएचओ राजेश कुमार को अलर्ट कर दिया है। फील्ड टीम सिंधी कैंप एटीएम की निगरानी के लिए रवाना हो रही है।',
      originalLanguage: 'Hindi',
      translatedText: 'Message received. I have alerted SHO Rajesh Kumar of Jaipur North. Field team is departing to monitor Sindhi Camp ATMs.',
      translatedLanguage: 'English',
      translationConfidence: 96,
      type: 'text',
      reactions: [{ emoji: '👍', count: 2, users: ['AS', 'RK'] }],
    },
    {
      id: 'msg-3',
      senderId: 'OFF-FLD-004',
      senderName: 'SI Manoj Meena',
      senderRank: 'Sub-Inspector',
      senderState: 'Rajasthan',
      channelId: 'case-44521',
      timestamp: '12:12 IST',
      originalText: 'நான் இப்போது சிந்தி கேம்ப் எஸ்பிஐ ஏடிஎம்-ல் இருக்கிறேன். சந்தேக நபர் கருப்பு நிற ஹூடி அணிந்து ஏடிஎம்-ல் நுழைகிறார்.',
      originalLanguage: 'Tamil',
      translatedText: 'मैं अभी सिंधी कैंप एसबीआई एटीएम पर मौजूद हूँ। संदिग्ध व्यक्ति काली हुडी पहनकर एटीएम में प्रवेश कर रहा है।',
      translatedLanguage: 'Hindi',
      translationConfidence: 94,
      type: 'text',
      reactions: [{ emoji: '⚠️', count: 4, users: ['AS', 'VR', 'RK', 'PN'] }],
    },
    {
      id: 'msg-4',
      senderId: 'OFF-FLD-004',
      senderName: 'SI Manoj Meena',
      senderRank: 'Sub-Inspector',
      senderState: 'Rajasthan',
      channelId: 'case-44521',
      timestamp: '12:14 IST',
      originalText: 'സംശയിക്കപ്പെടുന്ന വ്യക്തി എടിഎമ്മിനുള്ളിലാണ്. ബാക്കപ്പ് ടീം ഉടൻ എത്തണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.',
      originalLanguage: 'Malayalam',
      translatedText: 'Suspect is currently inside the ATM terminal. Requesting immediate backup team arrival.',
      translatedLanguage: 'English',
      translationConfidence: 95,
      type: 'voice',
      voiceDuration: '0:34',
      voiceTranscript: 'സൂപ്പർവൈസറെ അറിയിക്കുന്നു, ഞങ്ങൾ എടിഎം ഗേറ്റിൽ നിരീക്ഷണം നടത്തുകയാണ്, 2 ഉദ്യോഗസ്ഥരെ ഉടൻ അയക്കുക.',
      reactions: [{ emoji: '🚨', count: 3, users: ['RK', 'VR', 'AS'] }],
    },
    {
      id: 'msg-5',
      senderId: 'OFF-SBI-005',
      senderName: 'Priya Nambiar',
      senderRank: 'Chief Nodal Officer',
      senderState: 'SBI Banking Liaison',
      channelId: 'case-44521',
      timestamp: '12:22 IST',
      originalText: 'Confirmed: PNB account ₹1,85,000 has been completely blocked. For SBI account ending in 4491, remote ATM card debit session has been locked from core switch.',
      originalLanguage: 'English',
      translatedText: 'पुष्टि की गई: पीएनबी खाता ₹1,85,000 पूरी तरह से ब्लॉक कर दिया गया है। 4491 पर समाप्त होने वाले एसबीआई खाते के लिए, कोर स्विच से रिमोट एटीएम कार्ड डेबिट सत्र लॉक कर दिया गया है।',
      translatedLanguage: 'Hindi',
      translationConfidence: 99,
      type: 'text',
      reactions: [{ emoji: '✅', count: 4, users: ['AS', 'VR', 'RK', 'MM'] }],
    },
  ],
  'group-mewat-ring': [
    {
      id: 'grp-1',
      senderId: 'OFF-I4C-001',
      senderName: 'Dr. A. K. Saxena',
      senderRank: 'Joint Director (I4C)',
      senderState: 'National Command',
      channelId: 'group-mewat-ring',
      timestamp: '09:00 IST',
      originalText: 'Attention all state cyber cells: Inter-State Task Force for Mewat-Bharatpur triangle is now activated. 14 complaints in last 48 hours show common mule network.',
      originalLanguage: 'English',
      translatedText: 'सभी राज्य साइबर प्रकोष्ठ ध्यान दें: मेवात-भरतपुर त्रिकोण के लिए अंतर-राज्यीय कार्य बल अब सक्रिय हो गया है। पिछले 48 घंटों में 14 शिकायतें एक सामान्य म्यूल नेटवर्क दर्शाती हैं।',
      translatedLanguage: 'Hindi',
      translationConfidence: 98,
      type: 'text',
      reactions: [{ emoji: '👍', count: 8, users: ['VR', 'RK'] }],
    },
  ],
};

export interface TaskItem {
  id: string;
  title: string;
  caseId: string;
  assignedOfficerName: string;
  assignedOfficerRole: string;
  priority: PriorityLevel;
  deadline: string;
  location: string;
  requiredAction: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  isEscalated?: boolean;
}

export const TASKS_DATA: TaskItem[] = [
  {
    id: 'TSK-2026-081',
    title: 'Deploy Tactical Surveillance at Sindhi Camp SBI ATM',
    caseId: 'CY2026-MH-44521',
    assignedOfficerName: 'SI Manoj Meena',
    assignedOfficerRole: 'Field Squad Lead',
    priority: 'Critical',
    deadline: '05 Sept 2026, 14:00 IST',
    location: 'Station Road, Sindhi Camp, Jaipur',
    requiredAction: 'Deploy 2 undercover officers, monitor cash withdrawal attempts, verify identity against CCTV frame',
    status: 'IN_PROGRESS',
    isEscalated: false,
  },
  {
    id: 'TSK-2026-082',
    title: 'Statutory Account Freeze Execution via CFCFRMS',
    caseId: 'CY2026-MH-44521',
    assignedOfficerName: 'Priya Nambiar',
    assignedOfficerRole: 'SBI Nodal Liaison',
    priority: 'Critical',
    deadline: '05 Sept 2026, 13:00 IST',
    location: 'Central Banking Switch / CFCFRMS',
    requiredAction: 'Place immediate debit lien on SBI-XXXX-4491 and inform regional branch manager',
    status: 'COMPLETED',
    isEscalated: false,
  },
  {
    id: 'TSK-2026-083',
    title: 'Collect ATM CCTV Footage & Transaction Logs',
    caseId: 'CY2026-UP-44519',
    assignedOfficerName: 'Inspector Rajesh Kumar',
    assignedOfficerRole: 'District Cyber Cell Officer',
    priority: 'High',
    deadline: '05 Sept 2026, 16:00 IST',
    location: 'Tauru Road, Nuh (Mewat)',
    requiredAction: 'Serve Section 91 CrPC notice to bank branch for CCTV retrieval and DVR backup',
    status: 'PENDING',
    isEscalated: false,
  },
  {
    id: 'TSK-2026-084',
    title: 'Inter-State Suspect Interrogation Memo Dispatch',
    caseId: 'CY2026-DL-44502',
    assignedOfficerName: 'Dr. A. K. Saxena',
    assignedOfficerRole: 'I4C Central Admin',
    priority: 'High',
    deadline: '05 Sept 2026, 11:30 IST',
    location: 'Karmatanr, Jamtara',
    requiredAction: 'Transmit digital seizure memo and coordinate transit remand to East Delhi Cyber Police',
    status: 'COMPLETED',
    isEscalated: false,
  },
  {
    id: 'TSK-2026-085',
    title: 'Verify SIM Card CDR & Tower Dump for Tower Cell #912',
    caseId: 'CY2026-WB-44485',
    assignedOfficerName: 'Vikram Rathore, IPS',
    assignedOfficerRole: 'State Nodal Officer',
    priority: 'Critical',
    deadline: '05 Sept 2026, 12:00 IST',
    location: 'Gandhi Maidan, Patna',
    requiredAction: 'Acquire tower dump analysis from telecom nodal officer via Sanchar Saathi DoT integration',
    status: 'OVERDUE',
    isEscalated: true,
  },
];

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  officerName: string;
  officerId: string;
  role: string;
  action: string;
  entityType: 'CASE' | 'EVIDENCE' | 'CHAT' | 'REPORT' | 'FREEZE_ORDER' | 'LOGIN' | 'SYSTEM';
  entityId: string;
  ipAddress: string;
  deviceInfo: string;
  integrityHash: string;
  status: 'VERIFIED' | 'FLAGGED';
}

export const AUDIT_LOGS_DATA: AuditLogEntry[] = [
  {
    id: 'AUD-90124',
    timestamp: '05 Sept 2026, 12:45:10 IST',
    officerName: 'SI Manoj Meena',
    officerId: 'OFF-FLD-004',
    role: 'Field Investigator',
    action: 'UPLOADED_EVIDENCE',
    entityType: 'EVIDENCE',
    entityId: 'EVD-2026-902',
    ipAddress: '10.24.112.45',
    deviceInfo: 'Motorola Field Mobile MDT-12 (Android 14 Govt Build)',
    integrityHash: 'f4b2c1d0e9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-90123',
    timestamp: '05 Sept 2026, 12:22:04 IST',
    officerName: 'Priya Nambiar',
    officerId: 'OFF-SBI-005',
    role: 'Bank Liaison Officer',
    action: 'DISPATCHED_FREEZE_MANDATE',
    entityType: 'FREEZE_ORDER',
    entityId: 'SBI-XXXX-4491',
    ipAddress: '192.168.10.88',
    deviceInfo: 'SBI Nodal Secure Desktop (Windows 11 Enterprise)',
    integrityHash: 'c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-90122',
    timestamp: '05 Sept 2026, 12:05:40 IST',
    officerName: 'Insp. Rajesh Kumar',
    officerId: 'OFF-JPR-003',
    role: 'District Cyber Officer',
    action: 'STATUS_TRANSITION_SURVEILLANCE',
    entityType: 'CASE',
    entityId: 'CY2026-MH-44521',
    ipAddress: '10.14.88.12',
    deviceInfo: 'Jaipur HQ Workstation 02',
    integrityHash: '8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a9e1a',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-90121',
    timestamp: '05 Sept 2026, 11:48:19 IST',
    officerName: 'Vikram Rathore, IPS',
    officerId: 'OFF-RJ-002',
    role: 'State Nodal Officer',
    action: 'APPROVED_INTER_STATE_ACCESS',
    entityType: 'CASE',
    entityId: 'CY2026-MH-44521',
    ipAddress: '10.14.10.01',
    deviceInfo: 'SP Cyber Secure iPad Pro',
    integrityHash: '3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a9e1a8b7c6d5e4f',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-90120',
    timestamp: '05 Sept 2026, 11:42:01 IST',
    officerName: 'System Gateway (NCRP)',
    officerId: 'SYS-NCRP-HOOK',
    role: 'Automated Service',
    action: 'INGESTED_NEW_COMPLAINT',
    entityType: 'CASE',
    entityId: 'CY2026-MH-44521',
    ipAddress: '164.100.24.12',
    deviceInfo: 'MHA National Data Centre, New Delhi',
    integrityHash: 'd9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a9e1a8b7c6d5e4f3a2b1c0',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-90119',
    timestamp: '05 Sept 2026, 11:30:15 IST',
    officerName: 'Dr. A. K. Saxena',
    officerId: 'OFF-I4C-001',
    role: 'I4C Central Admin',
    action: 'SESSION_LOGIN_OTP_VERIFIED',
    entityType: 'LOGIN',
    entityId: 'OFF-I4C-001',
    ipAddress: '10.1.1.20',
    deviceInfo: 'MHA Secured Terminal (Cisco AnyConnect VPN)',
    integrityHash: 'a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a9e1a8b7c6d5e4f3a2b1c0d9e8f7',
    status: 'VERIFIED',
  },
];

export const INDIAN_LANGUAGES = [
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'as', name: 'Assamese (অসমীয়া)' },
  { code: 'raj', name: 'Rajasthani (राजस्थानी)' },
  { code: 'bho', name: 'Bhojpuri (भोजपुरी)' },
];
