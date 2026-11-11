export interface ProblemCard {
  title: string;
  text: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  icon: 'brain' | 'map' | 'shield' | 'bell';
  text: string;
}

export interface StepItem {
  step: string;
  title: string;
  text: string;
}

export interface StatItem {
  number: string;
  label: string;
}

export interface StakeholderCard {
  id: string;
  title: string;
  text: string;
}

export interface TechLayer {
  layer: string;
  description: string;
  technologies: string[];
}

export interface DataSourceItem {
  name: string;
  description: string;
}

export interface ChallengeCard {
  id: string;
  title: string;
  text: string;
}

export const content = {
  // SECTION 1: HERO
  hero: {
    headline: "Predicting Cybercrime Cash Withdrawals Before They Happen",
    subHeadline: "An AI-powered predictive analytics framework that transforms India's cybercrime response from reactive to proactive — forecasting likely cash withdrawal locations in real-time to enable timely intervention by law enforcement and financial institutions.",
    tagline: "National Cybercrime Predictive Analytics Platform | Ministry of Home Affairs & Indian Cyber Crime Coordination Centre (I4C)",
    buttonText: "Explore the Dashboard →",
    featuredIntel: {
      title: "FEATURED INTEL",
      status: "LIVE RADAR ACTIVE",
      items: [
        {
          tag: "CRITICAL_ALERT",
          headline: "Vishing Surge on Financial Institutions: Southwest Delhi ATM Hotspot Flagged",
          action: "READ INTEL →"
        },
        {
          tag: "MODEL_TELEMETRY",
          headline: "CyberCast Real-Time Prediction Accuracy Crosses 92%",
          action: "VIEW METRICS →"
        },
        {
          tag: "DISPATCH_FEED",
          headline: "I4C Unified Dispatch: 28 State Cyber Cells Synchronized",
          action: "SYSTEM STATUS →"
        }
      ]
    }
  },

  // SECTION 2: THE PROBLEM
  problem: {
    sectionTitle: "The Crisis We Are Solving",
    mainParagraph: "India's National Cybercrime Reporting Portal receives over 8,000 complaints every single day. The number is rising rapidly. In most financial fraud cases, stolen money is withdrawn from ATMs within 2 to 6 hours — long before law enforcement can act. The current system is entirely reactive: a victim reports, police investigate, and by then the money is gone.",
    cards: [
      {
        title: "8,000+ Daily Complaints",
        text: "The NCRP portal is overwhelmed with cybercrime complaints that are growing manifold every month. Manual processing cannot keep pace with the volume."
      },
      {
        title: "2-6 Hour Window",
        text: "Criminals withdraw stolen cash within hours of the fraud. By the time complaints are processed and investigated, the money trail goes cold."
      },
      {
        title: "No Predictive Intelligence",
        text: "Currently there is no system that predicts WHERE and WHEN stolen money will be withdrawn. Law enforcement operates blind until it is too late."
      }
    ] as ProblemCard[]
  },

  // SECTION 3: OUR SOLUTION
  solution: {
    sectionTitle: "A Weather Forecast for Cybercrime",
    mainParagraph: "Just as meteorologists predict where it will rain tomorrow, our system predicts where stolen money will be withdrawn next. By analyzing historical cybercrime patterns, geospatial data, banking infrastructure, and real-time complaint feeds, our AI engine generates actionable intelligence that enables law enforcement to act BEFORE the criminal reaches the ATM.",
    highlight: 'From "Crime → Complaint → Investigation → Money Gone" to "Complaint → Prediction → Deployment → Criminal Caught"',
    marqueeItems: [
      "Observe", "Enrich", "Predict", "Deploy", "Intercept", "Prevent", "Protect"
    ]
  },

  // SECTION 4: KEY FEATURES
  features: {
    sectionTitle: "What We Have Built",
    items: [
      {
        id: "01",
        title: "Predictive Analytics Engine",
        icon: "brain",
        text: "AI/ML-powered system that analyzes historical cybercrime data, financial transaction patterns, and geospatial intelligence to predict potential cash withdrawal hotspots with probability scoring. Features include pattern detection, geospatial risk modelling, temporal analysis, and real-time alert generation."
      },
      {
        id: "02",
        title: "Risk Heatmap Dashboard",
        icon: "map",
        text: "GIS-enabled interactive dashboard that visualizes real-time and predicted risk zones across India. Officers can drill down from national to state to district to street level. Filterable by time window, crime category, amount range, and risk severity."
      },
      {
        id: "03",
        title: "Law Enforcement Interface",
        icon: "shield",
        text: "Secure role-based platform for investigators at I4C, state, and district levels. Features include real-time alert feeds, intelligence reports, case timeline tracking, evidence documentation, cross-state collaboration tools, and outcome feedback loops."
      },
      {
        id: "04",
        title: "Alert & Notification System",
        icon: "bell",
        text: "Multi-channel real-time notification system that sends critical alerts to law enforcement, banks, and I4C officers via SMS, email, API webhooks, and dashboard triggers. Four-tier alert severity system ensures the right people get the right information at the right time."
      }
    ] as FeatureItem[]
  },

  // SECTION 5: HOW IT WORKS
  howItWorks: {
    sectionTitle: "How the System Works in Real-Time",
    steps: [
      {
        step: "01",
        title: "Complaint Filed",
        text: "Victim files a cybercrime complaint on the NCRP portal. Our system ingests the complaint data within seconds."
      },
      {
        step: "02",
        title: "AI Pattern Matching",
        text: "The predictive engine extracts key features — fraud type, amount, victim location, time, modus operandi — and matches them against thousands of historical cases."
      },
      {
        step: "03",
        title: "Location Prediction",
        text: "Based on pattern analysis, the AI predicts the top geographic zones where cash withdrawal is most likely, along with a probability score and time window."
      },
      {
        step: "04",
        title: "Heatmap Activation",
        text: "The predicted zones light up on the risk heatmap dashboard in real-time. Risk scores update dynamically as new complaints arrive."
      },
      {
        step: "05",
        title: "Automated Alerts",
        text: "Critical alerts are instantly sent to local police, nearby bank branches, and ATM operators in the predicted zone via SMS, email, and dashboard notifications."
      },
      {
        step: "06",
        title: "Proactive Intervention",
        text: "Law enforcement deploys teams to high-risk locations. Banks flag suspicious accounts. Criminals are intercepted or withdrawals are blocked before money is lost."
      }
    ] as StepItem[]
  },

  // SECTION 6: IMPACT & STATISTICS
  impact: {
    sectionTitle: "Expected Impact",
    stats: [
      {
        number: "8,000+",
        label: "Daily Complaints Processed in Real-Time"
      },
      {
        number: "2-6 hrs",
        label: "Critical Window for Cash Withdrawal Prediction"
      },
      {
        number: "28 States",
        label: "Pan-India Coverage with State-Level Intelligence"
      },
      {
        number: "4-Tier",
        label: "Alert Severity System for Prioritized Response"
      },
      {
        number: "Real-Time",
        label: "Heatmap Updates and Notification Delivery"
      },
      {
        number: "AI-Driven",
        label: "Continuous Learning from Police Feedback"
      }
    ] as StatItem[]
  },

  // SECTION 7: INTELLIGENCE SHARING ECOSYSTEM
  ecosystem: {
    sectionTitle: "Unified Defense Ecosystem",
    mainParagraph: "Our platform connects all stakeholders in the cybercrime response chain into a single coordinated network, breaking down silos between agencies and enabling faster, more effective intervention.",
    cards: [
      {
        id: "01",
        title: "I4C Command Center",
        text: "National-level oversight, inter-state coordination, strategic intelligence reports, and policy-level threat assessment."
      },
      {
        id: "02",
        title: "State Cyber Cells",
        text: "State-specific alerts, jurisdiction-level risk dashboards, case management, and coordination with district units."
      },
      {
        id: "03",
        title: "District Police",
        text: "Actionable ground-level alerts with specific ATM locations, deployment recommendations, and outcome reporting."
      },
      {
        id: "04",
        title: "Banks & Financial Institutions",
        text: "Real-time fraud alerts linked to CFCFRMS, faster fund blocking, suspicious account flagging, and recovery coordination."
      }
    ] as StakeholderCard[]
  },

  // SECTION 8: TECHNOLOGY STACK
  techStack: {
    sectionTitle: "Built With",
    layers: [
      {
        layer: "AI/ML Layer",
        description: "Python, Scikit-learn, XGBoost, TensorFlow, NLP for complaint text analysis, SMOTE for imbalanced data handling",
        technologies: ["Python", "Scikit-learn", "XGBoost", "TensorFlow", "NLP Text Analysis", "SMOTE"]
      },
      {
        layer: "Geospatial Layer",
        description: "Folium, GeoPandas, OpenStreetMap, GIS risk modelling, coordinate-based hotspot clustering",
        technologies: ["Folium", "GeoPandas", "OpenStreetMap", "GIS Modelling", "Hotspot Clustering"]
      },
      {
        layer: "Data Layer",
        description: "PostgreSQL, Apache Kafka for real-time ingestion, Pandas for data processing, multi-source data integration pipeline",
        technologies: ["PostgreSQL", "Apache Kafka", "Pandas", "Ingestion Pipeline", "ETL Stream"]
      },
      {
        layer: "Dashboard Layer",
        description: "Streamlit / React, interactive map visualizations, real-time WebSocket updates, role-based access control",
        technologies: ["Streamlit / React", "Interactive Maps", "WebSocket Updates", "RBAC Auth"]
      },
      {
        layer: "Alert Layer",
        description: "Twilio SMS API, SMTP email service, REST API webhooks, push notification service",
        technologies: ["Twilio SMS API", "SMTP Service", "REST Webhooks", "Push Notifications"]
      },
      {
        layer: "Security Layer",
        description: "End-to-end encryption, JWT authentication, role-based data access, complete audit trail logging",
        technologies: ["E2E Encryption", "JWT Auth", "Role-Based Access", "Audit Trail Logging"]
      }
    ] as TechLayer[]
  },

  // SECTION 9: DATA SOURCES
  dataSources: {
    sectionTitle: "Powered by Multi-Source Intelligence",
    mainParagraph: "Our predictive models are trained on a comprehensive dataset combining government crime statistics, banking infrastructure data, geospatial intelligence, telecom fraud databases, and real-time news signals.",
    sources: [
      {
        name: "National Crime Records Bureau (NCRB)",
        description: "Historical cybercrime statistics"
      },
      {
        name: "Reserve Bank of India (RBI)",
        description: "Banking and ATM infrastructure data"
      },
      {
        name: "OpenStreetMap",
        description: "Geospatial ATM and landmark locations"
      },
      {
        name: "Sanchar Saathi (DoT)",
        description: "Telecom fraud number intelligence"
      },
      {
        name: "TRAI",
        description: "Telecom penetration and spam data"
      },
      {
        name: "CERT-In",
        description: "Cybersecurity threat advisories"
      },
      {
        name: "data.gov.in",
        description: "Government open datasets and census data"
      },
      {
        name: "NewsAPI",
        description: "Real-time fraud pattern signals from media"
      },
      {
        name: "Kaggle Fraud Datasets",
        description: "Pre-training on global fraud patterns"
      }
    ] as DataSourceItem[]
  },

  // SECTION 10: CHALLENGES WE ADDRESS
  challenges: {
    sectionTitle: "Built for Real-World Complexity",
    cards: [
      {
        id: "01",
        title: "Data Quality & Multilingual Inputs",
        text: "Complaints arrive in 10+ languages with inconsistent formats. Our NLP pipeline standardizes and extracts structured intelligence from unstructured complaint text."
      },
      {
        id: "02",
        title: "Alert Fatigue Prevention",
        text: "Too many false alerts destroy trust. Our multi-layer verification system and confidence scoring ensure only high-probability predictions trigger field-level alerts."
      },
      {
        id: "03",
        title: "Criminal Adaptation",
        text: "Fraud networks evolve constantly. Our model includes continuous retraining loops and anomaly detection to identify emerging patterns before they become mainstream."
      },
      {
        id: "04",
        title: "Inter-Agency Coordination",
        text: "State police, central agencies, and banks historically operate in silos. Our unified platform enables real-time intelligence sharing across all jurisdictions."
      }
    ] as ChallengeCard[]
  },

  // SECTION 11: FEEDBACK LOOP
  feedbackLoop: {
    sectionTitle: "A System That Learns From Every Case",
    mainParagraph: "Our predictive engine does not remain static. Every alert outcome reported by field officers feeds back into the model. Correct predictions strengthen pattern confidence. Incorrect predictions recalibrate the algorithm. Over time, the system becomes increasingly accurate, adapting to new criminal tactics and seasonal variations in fraud activity.",
    visualText: "Complaint → Prediction → Alert → Police Action → Outcome Feedback → Model Retraining → Better Prediction",
    cycleSteps: [
      { number: "01", label: "Complaint" },
      { number: "02", label: "Prediction" },
      { number: "03", label: "Alert" },
      { number: "04", label: "Police Action" },
      { number: "05", label: "Outcome Feedback" },
      { number: "06", label: "Model Retraining" },
      { number: "07", label: "Better Prediction" }
    ]
  },

  // SECTION 12: FOOTER / CLOSING
  footer: {
    closingStatement: "Strengthening India's cybersecurity posture through data-driven, proactive defense against financial cybercrime.",
    projectDetails: {
      event: "National Cyber Defense Initiative",
      problemStatement: "Predictive ATM Interdiction Framework",
      organization: "Ministry of Home Affairs",
      department: "Indian Cyber Crime Coordination Centre (I4C), CIS Division",
      categoryTheme: "Section 63 BSA 2023 • CFCFRMS Gateway • 964 Police Districts"
    },
    teamSection: {
      teamName: "National Cyber Defense Taskforce",
      college: "Indian Cyber Crime Coordination Centre (I4C), MHA",
      members: "Directorate of Cyber Operations • Inter-State Taskforce",
      memberList: [
        { name: "I4C Central Directorate" },
        { name: "State Cyber Nodal Units" },
        { name: "District Cyber Police Stations" },
        { name: "Field Rapid Interdiction Squads" },
        { name: "Banking Liaison Desk (CFCFRMS)" },
        { name: "CERT-In National Response Grid" }
      ]
    }
  }
};
