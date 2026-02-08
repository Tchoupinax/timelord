import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const iconSvg = (path: string) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.featureIcon}
  >
    {path}
  </svg>
);

const icons = {
  dashboard: iconSvg(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>,
  ),
  agents: iconSvg(
    <>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
      <path d="M21 21v-2a4 4 0 0 0-4-4h-2" />
    </>,
  ),
  schedule: iconSvg(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>,
  ),
  git: iconSvg(
    <>
      <circle cx="12" cy="15" r="2.5" />
      <circle cx="6" cy="9" r="2.5" />
      <circle cx="18" cy="9" r="2.5" />
      <path d="M12 12.5V9 M12 9H6 M12 9h6" />
    </>,
  ),
  lock: iconSvg(
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>,
  ),
  chart: iconSvg(
    <>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </>,
  ),
};

type FeatureItem = {
  title: string;
  icon: keyof typeof icons;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Central Control Dashboard",
    icon: "dashboard",
    description: (
      <>
        Manage all your scheduled tasks from a single web dashboard. Create,
        monitor, and control jobs across your entire infrastructure from one
        place.
      </>
    ),
  },
  {
    title: "Distributed Agents",
    icon: "agents",
    description: (
      <>
        Deploy lightweight agents on your servers that execute tasks on your
        behalf. Secure, authenticated, and easy to set up with just a token.
      </>
    ),
  },
  {
    title: "Smart Scheduling",
    icon: "schedule",
    description: (
      <>
        Run tasks once, on a schedule, or on demand. With built-in CRON support,
        you have full control over when and how your tasks execute.
      </>
    ),
  },
  {
    title: "Git Integration",
    icon: "git",
    description: (
      <>
        Execute scripts directly from your Git repositories. Keep your
        automation code versioned and in sync across all your agents.
      </>
    ),
  },
  {
    title: "Secure by Default",
    icon: "lock",
    description: (
      <>
        Built-in OIDC authentication, encrypted communication, and secure secret
        management with Vault. Your infrastructure stays protected.
      </>
    ),
  },
  {
    title: "Real-time Monitoring",
    icon: "chart",
    description: (
      <>
        Track job execution in real time with detailed logs and status updates.
        See what’s happening across your infrastructure at any moment.
      </>
    ),
  },
];

const steps = [
  {
    step: 1,
    title: "Install Agents",
    desc: "Deploy lightweight agents on your servers with a simple installation script.",
  },
  {
    step: 2,
    title: "Create Jobs",
    desc: "Define tasks in the web dashboard with scripts from Git or inline commands.",
  },
  {
    step: 3,
    title: "Schedule Tasks",
    desc: "Set up CRON schedules or run tasks on demand whenever you need them.",
  },
  {
    step: 4,
    title: "Monitor & Relax",
    desc: "Watch your tasks run automatically with real-time logs and status.",
  },
];

function Feature({ title, icon, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")} style={{ marginBottom: "2rem" }}>
      <div className={clsx("card", styles.featureCard)}>
        {icons[icon]}
        <Heading as="h3" className={styles.featureTitle}>
          {title}
        </Heading>
        <p className={styles.featureDesc}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div style={{ textAlign: "center" }}>
          <Heading as="h2" className={styles.sectionTitle}>
            Why Choose Timelord?
          </Heading>
          <p className={styles.sectionSubtitle}>
            Everything you need to orchestrate tasks across your infrastructure
          </p>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>

        <div className={styles.howSection}>
          <Heading as="h2" className={styles.howTitle}>
            How Does It Work?
          </Heading>
          <div className={styles.stepsRow}>
            {steps.map(({ step, title, desc }) => (
              <div key={step} className={styles.stepCard}>
                <div className={styles.stepNumber}>{step}</div>
                <Heading as="h4" className={styles.stepTitle}>
                  {title}
                </Heading>
                <p className={styles.stepDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
