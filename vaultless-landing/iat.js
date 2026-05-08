const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak, UnderlineType
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 34, color: "1F3864", font: "Arial" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color: "2E5090", font: "Arial" })]
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: "C55A11", font: "Arial" })]
  });
}

function h4(text) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, bold: true, underline: { type: UnderlineType.SINGLE }, size: 22, color: "1F3864", font: "Arial" })]
  });
}

function p(text, bold = false, color = "000000") {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, bold, size: 22, font: "Arial", color })]
  });
}

function bullet(text, level = 0, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial", bold })]
  });
}

function note(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { fill: "FFF3CD", type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: "FFC107" } },
    indent: { left: 360 },
    children: [new TextRun({ text: "📌 " + text, size: 22, font: "Arial", bold: true, color: "7D4E00" })]
  });
}

function diagramNote(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { fill: "D9EDF7", type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: "2196F3" } },
    indent: { left: 360 },
    children: [new TextRun({ text: "🖼️ DIAGRAM TO LEARN: " + text, size: 22, font: "Arial", bold: true, color: "0D47A1" })]
  });
}

function tableRow(cells, isHeader = false) {
  return new TableRow({
    tableHeader: isHeader,
    children: cells.map((text, i) => new TableCell({
      borders,
      width: { size: Math.floor(9360 / cells.length), type: WidthType.DXA },
      shading: isHeader ? { fill: "1F3864", type: ShadingType.CLEAR } : (i % 2 === 0 ? { fill: "F5F5F5", type: ShadingType.CLEAR } : { fill: "FFFFFF", type: ShadingType.CLEAR }),
      margins: { top: 80, bottom: 80, left: 160, right: 160 },
      children: [new Paragraph({
        children: [new TextRun({ text, bold: isHeader, size: 20, font: "Arial", color: isHeader ? "FFFFFF" : "000000" })]
      })]
    }))
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: headers.map(() => Math.floor(9360 / headers.length)),
    rows: [tableRow(headers, true), ...rows.map(r => tableRow(r))]
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F3864", space: 1 } },
    spacing: { before: 200, after: 200 },
    children: []
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
          { level: 2, format: LevelFormat.BULLET, text: "▪", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    children: [

      // TITLE PAGE
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 240 },
        children: [new TextRun({ text: "BIS613D – Cloud Computing", bold: true, size: 52, font: "Arial", color: "1F3864" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: "IAT-2 Comprehensive Study Notes", bold: true, size: 36, font: "Arial", color: "C55A11" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 240 },
        children: [new TextRun({ text: "Module 3 & Module 4", size: 28, font: "Arial", color: "444444" })]
      }),
      divider(),

      // TABLE OF CONTENTS NOTE
      p("CONTENTS OVERVIEW", true, "1F3864"),
      bullet("MODULE 3: Cloud Platform Architecture", 0, true),
      bullet("Topic 1: Cloud Computing and Reference Model (Service Models)", 1),
      bullet("Topic 2: Architectural Design of Compute and Storage Clouds", 1),
      bullet("Topic 3: Inter-Cloud Resource Management", 1),
      bullet("MODULE 4: Cloud Security", 0, true),
      bullet("Topic 4: OS Security", 1),
      bullet("Topic 5: VM Security", 1),
      bullet("Topic 6: Trusted Hypervisor (Terra & Xoar)", 1),
      bullet("Topic 7: Mobile Devices and Cloud Security", 1),

      new Paragraph({ children: [new PageBreak()] }),

      // =============================================
      // MODULE 3
      // =============================================
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240 },
        shading: { fill: "1F3864", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "MODULE 3: Cloud Platform Architecture over Virtualized Datacenters", bold: true, size: 32, font: "Arial", color: "FFFFFF" })]
      }),

      // =============================================
      // TOPIC 1
      // =============================================
      h1("TOPIC 1: Cloud Computing and Reference Model (Service Models)"),

      h2("1.1 Types of Clouds"),
      makeTable(
        ["Cloud Type", "Description", "Examples", "Key Point"],
        [
          ["Public Cloud", "Hosted by 3rd-party providers; shared resources", "AWS, Azure, GCP", "Cost-effective but less control"],
          ["Private Cloud", "Dedicated to a single org; on-premises or hosted", "VMware vSphere, OpenStack", "More secure; higher cost"],
          ["Hybrid Cloud", "Combination of public + private", "AWS Outposts, Azure Stack", "Best of both worlds"],
        ]
      ),

      h2("1.2 Cloud Service Models (The 3 Core Models)"),
      note("These three models are the most important for exams. Learn the definitions, examples, advantages, and challenges for each."),

      h3("IaaS – Infrastructure as a Service"),
      bullet("Provides: virtualized computing, storage, networking over the internet"),
      bullet("Pay-as-you-go pricing; highly scalable; automated provisioning"),
      bullet("Examples: AWS EC2, Google Compute Engine, Microsoft Azure VMs"),
      bullet("Advantages: No physical hardware investment; global reach; disaster recovery"),
      bullet("Challenges: Needs cloud expertise; potential security risks"),

      h3("PaaS – Platform as a Service"),
      bullet("Provides: cloud-based environment for app development and deployment"),
      bullet("Includes: databases, runtime environments, development frameworks"),
      bullet("Examples: Google App Engine, AWS Elastic Beanstalk, Azure App Services"),
      bullet("Benefits: Reduces development complexity; scalable; developer focuses on code"),
      bullet("Challenges: Limited control over infrastructure; vendor lock-in"),

      h3("SaaS – Software as a Service"),
      bullet("Provides: fully managed software delivered over the internet"),
      bullet("Users access via web browsers on subscription basis"),
      bullet("Examples: Google Workspace, Microsoft 365, Salesforce"),
      bullet("Benefits: Easy access anywhere; auto-updates; lower upfront cost"),
      bullet("Challenges: Data security concerns; depends on internet; limited customization"),

      diagramNote("Figure 4.5 from PDF – The IaaS, PaaS, SaaS cloud service model diagram showing layered levels (DaaS, IaaS, PaaS, SaaS) with Launch Q, Monitor Q, Billing Q, Client Interface, Status DB, Master, Worker, Distributed File System."),

      h2("1.3 Cloud Ecosystem Components"),
      bullet("Cloud Providers: AWS, Google Cloud, Azure, IBM Cloud, Oracle Cloud", 0, true),
      bullet("Cloud Consumers: Businesses, developers, end-users"),
      bullet("Cloud Brokers: Intermediaries managing service usage/performance"),
      bullet("Security & Compliance: Identity management, encryption, regulatory tools"),

      h2("1.4 Key Enabling Technologies"),
      makeTable(
        ["Technology", "Role"],
        [
          ["Virtualization", "Multiple VMs on a single physical server"],
          ["Containerization", "Docker/Kubernetes for efficient app deployment"],
          ["Microservices", "Modular app development for scalability"],
          ["AI/ML", "Predictive analytics and intelligent automation"],
          ["Blockchain", "Secure transactions and decentralized services"],
        ]
      ),

      h2("1.5 Extended Cloud Service Layers (6 Layers)"),
      makeTable(
        ["Layer", "Full Form", "Examples"],
        [
          ["HaaS", "Hardware as a Service", "VMware, Intel, IBM, XenEnterprise"],
          ["NaaS", "Network as a Service", "AT&T, Qwest, AboveNet"],
          ["LaaS", "Location as a Service (Collocation)", "Savvis, Internap, Digital Realty Trust"],
          ["IaaS", "Infrastructure as a Service", "Amazon AWS, Azure, Rackspace"],
          ["PaaS", "Platform as a Service", "Google App Engine, Force.com, Azure"],
          ["SaaS", "Software as a Service", "Salesforce, Webex, Concur, RightNOW"],
        ]
      ),

      h2("1.6 Public Cloud Platforms – GAE, AWS, Azure"),

      h3("Google App Engine (GAE)"),
      bullet("Type: PaaS – does NOT provide IaaS"),
      bullet("Languages: Python, Java, Go, Node.js, PHP"),
      bullet("Key components: GFS (storage), MapReduce (computing), BigTable (database), Chubby (lock service)"),
      bullet("GAE Components: Datastore, Application Runtime, SDK, Admin Console, Web Service Infrastructure"),
      bullet("Free quota for Gmail users; pay for additional usage"),
      bullet("Focus: Application hosting and development (not infrastructure management)"),
      diagramNote("Figure 4.20 – Google Cloud platform with GFS master, Chubby, BigTable server, MapReduce, Scheduler slave, GFS chunkserver, all running on Linux."),

      h3("Amazon Web Services (AWS)"),
      bullet("Type: IaaS and PaaS – most flexible platform"),
      bullet("Key Services: EC2 (VMs), S3 (object storage), EBS (block storage), SQS (message queue), ELB (load balancer), CloudWatch (monitoring), RDS (database), EMR (big data), CloudFront (CDN)"),
      bullet("Advantages: Global infrastructure; broad services; strong security"),
      diagramNote("Figure 4.6 – Amazon VPC (Virtual Private Cloud) showing customer network, VPN gateway, subnets, router, EC2 instances, and AWS web services cloud."),
      diagramNote("Figure 4.21 – Amazon cloud computing infrastructure showing EC2, EBS, SQS, S3, SimpleDB, and developer connections."),

      h3("Microsoft Azure"),
      bullet("Launched: 2008; built on Windows OS and Microsoft virtualization"),
      bullet("Core Services: Live Service, .NET Service, SQL Azure, SharePoint Service, Dynamic CRM Service"),
      bullet("Communication: Uses SOAP and REST"),
      bullet("Key differentiators: Seamless Microsoft integration; SDK for local dev/testing; hybrid cloud capabilities"),
      bullet("Target: Enterprises using Microsoft technologies"),

      makeTable(
        ["Feature", "GAE", "AWS", "Azure"],
        [
          ["Model", "PaaS only", "IaaS + PaaS", "PaaS (focus on .NET)"],
          ["Virtualization", "Application-level", "Extreme flexibility (VMs)", "Programming-level (.NET)"],
          ["Languages", "Python, Java, Go", "All (any on VM)", ".NET Framework"],
          ["Focus", "App hosting/dev", "Comprehensive cloud", "Enterprise/Microsoft integration"],
        ]
      ),

      divider(),

      // =============================================
      // TOPIC 2
      // =============================================
      h1("TOPIC 2: Architectural Design of Compute and Storage Clouds"),

      h2("2.1 Cloud Platform Design Goals"),
      bullet("Scalability – expand resources via cluster architecture"),
      bullet("Virtualization – flexible infrastructure using VMs"),
      bullet("Efficiency – optimize resource usage"),
      bullet("Reliability – store data in multiple geographically distributed locations"),
      note("Cloud platforms support Web 2.0 applications by managing user requests, allocating resources, and provisioning services across physical and virtual machines."),

      h2("2.2 Generic Cloud Architecture – Three Layer Model"),
      makeTable(
        ["Layer", "What It Manages", "Technologies"],
        [
          ["Compute Layer", "VMs, containers, serverless functions", "Xen, KVM, VMware, Docker"],
          ["Storage Layer", "Block, object, and file storage", "S3, EBS, GFS, HDFS, NFS"],
          ["Networking Layer", "Firewalls, load balancers, SDN", "SDN, VLANs, Fat-tree, Clos"],
        ]
      ),
      diagramNote("Figure 4.14 – Security-aware cloud platform showing Data Centers, Cloud provisioning, Resource provisioning/virtualization, Trust delegation, Clients, Services catalogs, and Security/performance monitoring."),
      diagramNote("Figure 4.15 – Layered architectural development showing Infrastructure layer (IaaS), Platform layer (PaaS), Application layer (SaaS) from bottom to top, connected to Public, Hybrid, and Private clouds."),

      h2("2.3 Market-Oriented Cloud Architecture"),
      p("Traditional resource management is insufficient. Market-oriented management balances supply and demand."),
      bullet("Users/Brokers – Submit service requests from anywhere"),
      bullet("SLA Resource Allocator – Interface between cloud providers and users"),
      bullet("Service Request Examiner – Interprets and prioritizes requests"),
      bullet("Accounting Mechanism – Tracks resource usage for billing"),
      bullet("VM Monitor – Monitors VM availability"),
      bullet("Dispatcher – Assigns requests to VMs"),
      bullet("Service Request Monitor – Tracks execution progress"),
      bullet("Pricing Mechanism – Based on peak/off-peak, fixed/dynamic rates"),

      h2("2.4 Quality of Service (QoS) Factors"),
      bullet("Time – Speed of service delivery"),
      bullet("Cost – Resource pricing models"),
      bullet("Reliability – Service availability guarantees"),
      bullet("Security – Data protection and access control"),
      bullet("Latency – Minimizing delays in service response"),
      bullet("Bandwidth – Ensuring efficient data transmission"),

      h2("2.5 Virtualization Support"),

      h3("Key Functions of Virtualization in Cloud"),
      bullet("Hardware Virtualization – Unmodified OS on virtual hardware"),
      bullet("Flexible Development & Deployment – Same environment for dev and production"),
      bullet("Multi-Tenant Isolation – VMs securely separate users"),
      bullet("Hosting Third-Party Apps – VMs host external applications"),
      bullet("Scalability & Customization – Configure VMs without affecting other tenants"),

      h3("VM Cloning for Disaster Recovery"),
      makeTable(
        ["Recovery Type", "Description"],
        [
          ["Traditional Recovery", "Slow and expensive; reinstall hardware, OS, software"],
          ["VM-Based Recovery", "Faster (40% of traditional time); uses snapshots for live migration"],
          ["Data Replication", "Synchronous and asynchronous replication"],
          ["Snapshot Backups", "Periodic copies of VMs and storage volumes"],
          ["Failover Mechanisms", "Redundant systems auto-take over on failure"],
          ["Geographic Redundancy", "Backup data across multiple cloud regions"],
        ]
      ),

      h2("2.6 Data Center Design"),

      h3("Warehouse-Scale Data Centers"),
      bullet("Host thousands of servers; key factors: redundancy, scalability, energy efficiency, security"),
      bullet("Cooling: CRAC (Computer Room Air Conditioning) units; raised floors; cold/hot aisles"),
      bullet("Modern enhancements: water-based free cooling and cooling towers"),
      diagramNote("Figure 4.9 – Cooling system in raised-floor data center showing CRAC units, liquid supply, rack arrangement, floor tiles, and hot-cold air circulation."),

      h3("Network Topologies"),
      makeTable(
        ["Topology", "Features"],
        [
          ["Fat-tree", "High bandwidth, low latency; used in cloud data centers"],
          ["Clos Network", "Efficient routing and redundancy"],
          ["SDN (Software-Defined Networking)", "Dynamic network configuration and automation"],
        ]
      ),
      diagramNote("Figure 4.10 – Fat-tree interconnection topology for scalable data-center construction showing Core switches, Edge switches, Aggregation, Edge, and Pods (Pod 0–3)."),
      diagramNote("Figure 4.2 – Standard data-center networking with Internet (BR/border routers), Layer 3 access routers (AR), Layer 2 switches (S), Load balancers (LB), and Rack of servers (A)."),

      h3("Data Center Management Issues"),
      bullet("Make common users happy – 30-year service quality design"),
      bullet("Controlled information flow – Sustained services and HA"),
      bullet("Multiuser manageability – Traffic, database, server maintenance"),
      bullet("Scalability – Growth in storage, processing, I/O, power, cooling"),
      bullet("Reliability in virtualized infrastructure – Failover, VM live migration"),
      bullet("Low cost – Reduce operational costs for users and providers"),
      bullet("Security enforcement – Protect against network attacks"),
      bullet("Green IT – Save power consumption and improve energy efficiency"),

      divider(),

      // =============================================
      // TOPIC 3
      // =============================================
      h1("TOPIC 3: Inter-Cloud Resource Management"),

      h2("3.1 Resource Provisioning Methods"),
      p("Cloud providers must balance underprovisioning (SLA violations) and overprovisioning (resource waste)."),
      makeTable(
        ["Method", "How It Works", "Strength", "Weakness"],
        [
          ["Demand-Driven", "Adjusts based on utilization thresholds (e.g., EC2 auto-scaling)", "Simple", "Ineffective for abrupt changes"],
          ["Event-Driven", "Allocates based on predicted spikes (e.g., seasonal sales)", "Minimizes QoS loss if accurate", "Depends on prediction accuracy"],
          ["Popularity-Driven", "Based on Internet search trends", "Anticipates traffic surges", "May waste if forecasts wrong"],
        ]
      ),
      diagramNote("Figure 4.24 – Three cases of cloud resource provisioning without elasticity: (a) heavy waste from overprovisioning, (b) underprovisioning 1, (c) under-then-overprovisioning."),
      diagramNote("Figure 4.25 – EC2 performance results on AWS EC2 platform comparing demand-driven, event-driven, and popularity-driven provisioning methods."),

      h2("3.2 Dynamic Resource Deployment"),
      bullet("Dynamic provisioning allows cloud systems to scale across multiple resource sites"),
      bullet("InterGrid Infrastructure (Melbourne University): cross-grid resource allocation via InterGrid Gateways (IGGs)"),
      bullet("Allows interaction between local clusters and external cloud providers"),
      diagramNote("Figure 4.26 – Cloud resource deployment using IGG (intergrid gateway) to allocate VMs from a local cluster to interact with public cloud provider IGG."),

      h2("3.3 Storage Resource Provisioning"),
      makeTable(
        ["Storage System", "Key Feature"],
        [
          ["Google File System (GFS)", "High bandwidth for continuous access"],
          ["Hadoop HDFS", "Open-source alternative to GFS"],
          ["Amazon S3 & EBS", "Remote data storage and virtual disk services"],
          ["Google BigTable", "Structured and semi-structured data"],
          ["Amazon SimpleDB", "Scalable NoSQL database"],
          ["Microsoft Azure SQL", "Cloud-based relational database"],
        ]
      ),

      h2("3.4 Virtual Machine Creation and Management"),
      bullet("Independent Service Management – APIs for independent services (e.g., SQS)"),
      bullet("Running Third-Party Apps – Web services APIs instead of runtime libraries"),
      bullet("VM Manager (VMM) – Links gateways to resources; supports OpenNebula, EC2, Grid'5000"),
      bullet("VM Templates – Define processor allocation, memory, disk image, OS kernel, pricing"),
      bullet("Distributed VM Management – InterGrid platform for cross-site VM requests and allocation"),
      bullet("InterCloud Resource Exchange – Global data centers for dynamic allocation and load balancing"),
      bullet("Cloud Exchange (CEx) – Marketplace using auctions and commodity market models; ensures QoS-driven SLA contracts"),
      diagramNote("Figure 4.27 – VM manager service showing public API, IaaS interface (OpenNebula, OAR/Kadeploy), Amazon EC2, local physical infrastructure, Grid'5000, with template directory (ubuntu, fedora, opensuse)."),

      new Paragraph({ children: [new PageBreak()] }),

      // =============================================
      // MODULE 4
      // =============================================
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240 },
        shading: { fill: "7B0000", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "MODULE 4: Cloud Security", bold: true, size: 32, font: "Arial", color: "FFFFFF" })]
      }),

      // =============================================
      // TOPIC 4
      // =============================================
      h1("TOPIC 4: Operating System (OS) Security"),

      h2("4.1 Introduction"),
      p("OS security ensures protection of applications, data, and hardware against unauthorized access, manipulation, and malicious attacks. The OS acts as intermediary between applications and hardware — a critical component in cloud security."),

      h2("4.2 Key Security Aspects of an OS"),
      makeTable(
        ["Aspect", "Description"],
        [
          ["Access Control", "Policies defining how users/apps interact with system resources"],
          ["Authentication Mechanisms", "Validating user identities before granting access"],
          ["Data Protection", "Encrypting sensitive files and securing storage"],
          ["System Integrity", "Preventing unauthorized modifications to the OS"],
          ["Application Security", "Isolating and securing apps to prevent exploitation"],
        ]
      ),

      h2("4.3 Major Security Threats to Operating Systems"),

      h3("1. Unauthorized Access & Privilege Escalation"),
      bullet("Attackers exploit weak passwords, misconfigured permissions, software vulnerabilities"),
      bullet("Insider threats can misuse admin privileges to manipulate system settings"),

      h3("2. Malware Attacks"),
      bullet("Viruses, worms, Trojans, ransomware, and spyware target OS vulnerabilities"),
      bullet("Rootkits: allow attackers persistent access while hiding malicious activities"),

      h3("3. Application Vulnerabilities"),
      bullet("Buffer Overflows – Inject excessive data into buffers to execute arbitrary code"),
      bullet("Code Injection Attacks – Malicious scripts injected to execute harmful commands"),

      h3("4. OS Configuration & Patch Management Issues"),
      bullet("Unpatched OS allows exploitation of known vulnerabilities"),
      bullet("Default configurations may have insecure settings"),

      h3("5. Lack of Secure Communication"),
      bullet("Unencrypted connections expose data in transit to interception"),
      bullet("Man-in-the-Middle (MitM) attacks compromise authentication and data integrity"),

      h2("4.4 Security Measures for Operating Systems"),
      makeTable(
        ["Security Measure", "Description"],
        [
          ["MAC Policies (Mandatory Access Control)", "Prevent unauthorized process access; e.g., SELinux enforces strict policies"],
          ["Strong Authentication & User Management", "Password complexity + MFA + Least Privilege Principles (LPP)"],
          ["Regular Patch Management", "Automate OS updates; use vulnerability scanners"],
          ["Secure File Systems & Encryption", "BitLocker (Windows), LUKS (Linux); File Integrity Monitoring (FIM)"],
          ["Application Sandboxing & TEE", "Isolate apps; Trusted Execution Environments for secure processing"],
          ["Network Security Hardening", "Firewall policies; IDS (Intrusion Detection) and IPS (Intrusion Prevention)"],
          ["System Logging & Monitoring", "Event logging; SIEM (Security Information and Event Management)"],
        ]
      ),

      divider(),

      // =============================================
      // TOPIC 5
      // =============================================
      h1("TOPIC 5: Virtual Machine (VM) Security"),

      h2("5.1 Definition"),
      p("VM security refers to protection of virtualized environments from unauthorized access, data breaches, malware attacks, and system vulnerabilities. Involves securing both the hypervisor and guest VMs to maintain data confidentiality, integrity, and availability."),

      h2("5.2 Importance of VM Security"),
      bullet("Ensures data confidentiality; prevents unauthorized access"),
      bullet("Protects shared resources in multi-tenant environments"),
      bullet("Prevents hypervisor attacks compromising multiple VMs"),
      bullet("Safeguards virtual networks from malware and lateral attacks"),
      bullet("Supports regulatory compliance (GDPR, HIPAA, ISO 27001)"),

      h2("5.3 Key Components of VM Security"),
      makeTable(
        ["Component", "Description", "Security Risk"],
        [
          ["VMM / Hypervisor", "Manages VMs and hardware resources", "If compromised, attacker controls ALL guest VMs"],
          ["Guest VMs", "Each runs independently; may use different OS", "VM escape attacks – compromised VM attacks host/others"],
          ["Virtual Networking", "Virtual switches/routers manage inter-VM traffic", "Misconfiguration exposes VMs to external attacks"],
          ["Virtual Storage", "Cloud-based storage (S3, Google Cloud Storage)", "Data exposure from misconfigured access controls"],
        ]
      ),

      h2("5.4 Types of Hypervisors"),
      makeTable(
        ["Type", "Description", "Examples"],
        [
          ["Type 1 (Bare-metal)", "Runs directly on hardware", "VMware ESXi, Microsoft Hyper-V, Xen"],
          ["Type 2 (Hosted)", "Runs on a host OS", "VirtualBox, VMware Workstation"],
        ]
      ),
      diagramNote("Figure 11.3 – Two VM security architectures: (A) Security services provided by hypervisor/VMM with Guest VMs and Applications; (B) A dedicated security VM with Trusted Computing Base (TCB), Reduced Guest OS, Security Services VM."),

      h2("5.5 NIST Classification of VM Threats"),

      h3("Hypervisor-Based Threats"),
      bullet("Starvation of resources / DoS – Badly configured resource limits; rogue VM bypassing limits"),
      bullet("VM side-channel attacks – Malicious VM attacks others under same hypervisor; lack of inter-VM traffic isolation"),
      bullet("Buffer overflow attacks"),

      h3("VM-Based Threats"),
      bullet("Deployment of rogue/insecure VMs – Unauthorized users creating insecure instances"),
      bullet("Insecure/tampered VM images in repository – Lack of access control; no integrity verification"),
      bullet("Privilege Escalation Attacks – Exploiting vulnerabilities to gain higher-level privileges"),

      h2("5.6 Security Risks from Shared VM Images (AMIs)"),

      h3("Context: AWS Amazon Machine Images (AMIs)"),
      bullet("Quick Start AMIs – Official, pre-configured images"),
      bullet("Community AMIs – User-shared images (HIGH RISK)"),
      note("A six-month study analyzed 5,303 AMIs: 98% of Windows AMIs had critical vulnerabilities; 58% of Linux AMIs had critical vulnerabilities."),

      h3("Three Key Security Risks in Shared AMIs"),
      p("Risk 1: Backdoors & Leftover Credentials", true),
      bullet("22% of Linux AMIs had credentials allowing remote login"),
      bullet("Found: 100 passwords, 995 SSH keys, 90 cases with both exposed"),
      bullet("Attack vectors: SSH key backdoors; password-based authentication cracks"),
      bullet("Prevention: Revoke SSH keys; disable password login; run cloud-init scripts"),

      p("Risk 2: Unsolicited Connections & Data Leaks", true),
      bullet("Compromised AMIs leak: instance IP, system logs, login events, user activity"),
      bullet("Example: Modified syslog daemons forwarding logs to external server"),
      bullet("Prevention: Monitor outgoing traffic; restrict external connections via firewall; use IDS"),

      p("Risk 3: Malware & Trojan Infections", true),
      bullet("Trojan-Spy – Keylogging, data theft, process monitoring"),
      bullet("Trojan-Agent – Steals stored passwords from Firefox"),
      bullet("Prevention: Scan with ClamAV; avoid public AMIs from unknown sources"),

      h2("5.7 Best Practices for VM/AMI Security"),
      h3("For AMI Users"),
      bullet("Avoid public/shared AMIs unless verified from trusted source"),
      bullet("Scan AMIs using Nessus or ClamAV before use"),
      bullet("Reset passwords and SSH keys immediately after launching"),
      bullet("Monitor outgoing network traffic for unusual connections"),
      h3("For AMI Creators"),
      bullet("Remove API keys, SSH keys, browser/shell history before publishing"),
      bullet("Use shred, scrub, zerofree, or wipe to erase deleted files securely"),
      bullet("Never store API keys in an AMI"),
      bullet("Perform deep malware scan before distributing"),

      divider(),

      // =============================================
      // TOPIC 6
      // =============================================
      h1("TOPIC 6: Trusted Hypervisor (Xoar and Terra)"),

      h2("6.1 Security Risks from Management OS (Dom0 in Xen)"),

      h3("Context: Xen Hypervisor Architecture"),
      bullet("Xen hypervisor: ~60,000 lines of code (much smaller than traditional OS)"),
      bullet("Management OS (Dom0) handles: VM creation/admin, storage/network operations, device driver support, live migration"),
      bullet("Trusted Computing Base (TCB) = Hardware + Hypervisor (Xen) + Management OS (Dom0)"),
      note("A study found 21 out of 23 attacks targeted Dom0. 11 attacks exploited buffer overflow vulnerabilities; 8 were DoS attacks."),
      diagramNote("Figure 11.4 – Xen-based environment showing Management OS (Dom0) with admin tools, live migration, device drivers; Xen hypervisor with Domain0 control interface, Virtual x86 CPU, Virtual physical memory, Virtual network, Virtual block devices; x86 hardware at bottom."),

      h3("Security Risks During VM Creation (by Dom0)"),
      bullet("Dom0 can refuse to start VM (DoS attack)"),
      bullet("Modify guest OS kernel to allow remote access"),
      bullet("Set incorrect page tables → compromise memory integrity"),
      bullet("Retain foreign mapping access → spy on VM while running"),

      h3("Security Risks During VM Execution"),
      bullet("Dom0 uses 'split drivers' (frontend in guest VM, backend in Dom0) for I/O"),
      bullet("Potential attacks: Eavesdropping on data transfers; extracting cryptographic keys; blocking/modifying XenStore access"),

      h3("Mitigation Strategies for Dom0"),
      makeTable(
        ["Security Concern", "Solution"],
        [
          ["Virtual CPU protection", "Encrypt CPU registers when saving/restoring VM state"],
          ["Memory protection", "Encrypt memory pages before giving access to Dom0"],
          ["Integrity checks", "Hypervisor verifies VM integrity after every Dom0 access"],
          ["XenStore access", "Restrict access to prevent malicious configuration changes"],
          ["Monitoring", "Monitor Dom0 activity to detect suspicious behavior"],
        ]
      ),
      note("Performance overhead of security: Domain Build Time +1.7x–2.3x; Save Time +1.3x–1.5x; Restore Time +1.7x–1.9x. Security comes with performance cost."),

      h2("6.2 Xoar – Breaking the Monolithic TCB Design"),

      h3("What is Xoar?"),
      p("Xoar is a modified version of Xen designed to enhance security by applying microkernel design principles. Unlike Xen's monolithic design, Xoar is modular — each component has limited privileges."),

      h3("Xoar Design Goals"),
      bullet("Maintain functionality of Xen"),
      bullet("Tightly control privileges – each component has minimum required privileges"),
      bullet("Minimize component interfaces – reduce attack vectors"),
      bullet("Eliminate unnecessary sharing"),
      bullet("Explicitly define sharing – enable proper logging and auditing"),
      bullet("Reduce attack exposure window – minimize the time components are active"),

      h3("Four Types of Xoar Components"),
      makeTable(
        ["Type", "When Active", "Examples"],
        [
          ["Permanent", "Always active", "XenStore-State (maintains system state)"],
          ["Self-Destructing", "Used only during boot, then removed", "PCIBack (PCI bus), Bootstrapper (hardware init)"],
          ["Restarted on Request", "Loaded only when needed", "XenStore-Logic, Toolstack, Builder"],
          ["Restarted on Timer", "Periodically restarted for security freshness", "BlkBack (storage drivers), NetBack (network drivers)"],
        ]
      ),
      diagramNote("Figure 11.5 – Xoar component architecture showing PCIBack, Bootstrapper (self-destructing), XenStore-State (permanent), BlkBack, NetBack (restarted on timer), XenStore-Logic, Toolstack, Builder (restarted on request), QEMU, and Guest VM."),
      diagramNote("Figure 11.6 – Component sharing between guest VMs in Xoar: Two VMs share only XenStore components; each has private BlkBack, NetBack, and Toolstack."),

      h3("Xoar vs Xen Comparison"),
      makeTable(
        ["Feature", "Xen", "Xoar"],
        [
          ["TCB Size", "Large, monolithic", "Modular, reduced size"],
          ["VM Boot Process", "Runs continuously", "Self-destructing components"],
          ["Service Sharing", "Shared among all VMs", "Users can restrict sharing"],
          ["Audit Logging", "Limited tracking", "Secure, append-only logs on separate server"],
          ["Recovery Method", "Full reboot", "Fast snapshot recovery (Copy-on-Write)"],
          ["Attack Surface", "Large (more active components)", "Smaller (only active when needed)"],
        ]
      ),

      h3("Key Security Enhancements in Xoar"),
      bullet("Most privileged components (PCIBack & Bootstrapper) removed after booting"),
      bullet("Builder (VM initialization) has only 13,000 lines of code – very small"),
      bullet("XenStore split into: XenStore-Logic (handles changes) + XenStore-State (maintains records)"),
      bullet("Secure audit logs – append-only, stored on separate secure server"),
      bullet("Snapshot-based recovery using Copy-on-Write (COW) mechanism – faster than full reboot"),

      h2("6.3 Terra – Trusted Hypervisor"),

      h3("What is Terra?"),
      p("Terra is a trusted hypervisor designed to provide higher security guarantees than traditional hypervisors like Xen. It supports both open-box and closed-box OS abstractions."),

      h3("Terra's Key Security Features"),
      makeTable(
        ["Feature", "Description"],
        [
          ["Open-Box Platform", "Traditional OS abstraction allowing user access and modifications"],
          ["Closed-Box Platform", "Highly secure; users cannot inspect or modify system contents; used for financial transactions, e-voting"],
          ["Attestation", "Apps can prove trustworthiness to remote entities using cryptography"],
          ["Trusted Paths", "Ensures users interact with correct VM; prevents man-in-the-middle attacks"],
          ["Strong Isolation", "Hypervisor operates at highest privilege; no root access for admins"],
          ["Management VM", "Separate from Guest VMs; controls VM count, resource allocation, I/O access"],
        ]
      ),

      h3("Information Assurance (IA) in Closed-Box Platform"),
      bullet("Integrity – Ensures data remains unaltered"),
      bullet("Availability – Ensures system uptime"),
      bullet("Confidentiality – Protects sensitive data"),
      bullet("Authenticity & Non-repudiation – Verifies identities; prevents denial of actions"),

      h3("Challenges in Terra"),
      bullet("Device drivers: Large codebase = more vulnerabilities; many poorly written"),
      bullet("Malicious I/O devices can exploit Direct Memory Access (DMA) to modify kernel"),
      bullet("Solution: Restrict driver access; implement hardware protection mechanisms"),

      divider(),

      // =============================================
      // TOPIC 7
      // =============================================
      h1("TOPIC 7: Mobile Devices and Cloud Security"),

      h2("7.1 Importance"),
      p("Mobile devices interact with cloud services for data access, storage, and application execution. They introduce unique security challenges that can threaten cloud infrastructure."),

      h2("7.2 Mobile Device Technology Stack"),
      makeTable(
        ["Layer", "Description"],
        [
          ["Hardware", "Physical device; contains security chips for encryption keys and certificates"],
          ["Firmware", "Low-level software; baseband processor operates outside mobile OS control"],
          ["Operating System", "Android, iOS; manages applications and hardware"],
          ["Applications", "User-facing apps; may request excessive permissions"],
        ]
      ),
      note("Baseband processors (telephony services) operate OUTSIDE mobile OS control — a key vulnerability. Attackers can exploit firmware vulnerabilities."),

      h2("7.3 Four Core Security Challenges for Mobile Devices"),
      bullet("Confidentiality – Prevent unauthorized access to data"),
      bullet("Integrity – Detect unauthorized modifications"),
      bullet("Availability – Ensure users can access cloud resources"),
      bullet("Non-repudiation – Ensure sender cannot deny sending a message"),

      h2("7.4 Why Mobile Devices Are More Vulnerable"),
      bullet("Frequent internet access (WiFi and cellular networks)"),
      bullet("Easy app installations from third-party stores"),
      bullet("Use of untrusted networks for communication"),
      bullet("Weaker authentication methods (short passcodes)"),
      bullet("Location services enable tracking and targeted attacks"),

      h2("7.5 Common Mobile Security Threats"),
      makeTable(
        ["Threat", "Description"],
        [
          ["Mobile malware", "Viruses, spyware, Trojans targeting mobile OS"],
          ["Data loss", "Due to theft or improper device disposal"],
          ["Unauthorized access", "Weak PINs/passwords expose data"],
          ["Electronic eavesdropping", "Interception of communications"],
          ["Electronic tracking", "Via GPS and location services"],
          ["Third-party app access", "Apps collecting more data than needed"],
        ]
      ),

      h2("7.6 Mobile Security Risks Impacting the Cloud"),
      bullet("Ransomware-infected mobile files can migrate to cloud backups"),
      bullet("Cloud data leaks due to compromised mobile devices"),
      bullet("Weak authentication allows unauthorized cloud access"),
      bullet("Loss of device → Access control vulnerabilities (smudge attacks on screens)"),
      bullet("Lack of encryption for cloud data in transit"),
      bullet("Jailbroken/rooted devices bypass security measures"),
      bullet("Malicious apps bypassing access controls"),
      bullet("Misconfigured GPS → unauthorized tracking"),
      bullet("Fake mobility profiles → man-in-the-middle attacks"),

      h2("7.7 Enterprise Mobile Management (EMM) Solutions"),
      bullet("Mobile Device Management (MDM) – Manage physical devices"),
      bullet("Mobile Application Management (MAM) – Manage apps on devices"),

      h2("7.8 Key Security Policies for Mobile-Cloud Security"),
      makeTable(
        ["Category", "Policy"],
        [
          ["Storage Protection", "Device encryption + application-level encryption; remote wipe for stolen/lost devices"],
          ["Data Transmission", "Use TLS (Transport Layer Security) for all communication"],
          ["Application Security", "Use sandboxing to isolate apps and prevent data leaks"],
          ["Device Integrity", "Verify secure boot; regularly update OS and apps"],
          ["Access Control", "Enforce MFA; restrict cloud access to authorized devices only"],
          ["Auditing & Monitoring", "Log all device and app activities; automated compliance checks"],
          ["Policy Enforcement", "Automated alerts for security violations"],
        ]
      ),

      h2("7.9 Case Study: Microsoft Cloud MDM Portal"),
      p("Mobile Device Management for Microsoft Outlook requires users to:"),
      bullet("Download Microsoft Community Portal App"),
      bullet("Authenticate using mobile OS lock screen"),
      bullet("Encrypt all device-stored data"),
      p("Administrators manage policies via a web-based cloud MDM portal."),

      divider(),

      // QUICK REVISION SUMMARY
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240 },
        shading: { fill: "1A5276", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "QUICK REVISION – KEY DIAGRAMS TO STUDY FROM PDF", bold: true, size: 28, font: "Arial", color: "FFFFFF" })]
      }),

      h2("Module 3 – Diagrams"),
      makeTable(
        ["Figure", "Topic", "What It Shows"],
        [
          ["Figure 4.1", "Cloud Types", "Public, private, hybrid clouds with functional architecture and connectivity"],
          ["Figure 4.2", "Data Center Networking", "Standard data-center networking: BR, AR, LB, S (switches), Racks"],
          ["Figure 4.5", "Service Models", "IaaS, PaaS, SaaS service levels with Launch Q, Monitor Q, Billing Q"],
          ["Figure 4.6", "AWS VPC", "Amazon Virtual Private Cloud architecture"],
          ["Figure 4.9", "DC Cooling", "Raised-floor data center CRAC cooling with hot-cold aisles"],
          ["Figure 4.10", "Fat-tree Topology", "Fat-tree interconnection with core switches, edge, aggregation, pods"],
          ["Figure 4.14", "Generic Cloud", "Security-aware cloud platform with VMs, storage, networking, clients"],
          ["Figure 4.15", "Layered Architecture", "IaaS → PaaS → SaaS layers over Internet"],
          ["Figure 4.20", "GAE Architecture", "Google cloud platform with GFS, BigTable, MapReduce, Chubby"],
          ["Figure 4.21", "AWS Architecture", "Amazon cloud infrastructure: EC2, EBS, SQS, S3, SimpleDB"],
          ["Figure 4.24", "Provisioning Cases", "Three provisioning scenarios: overprovisioning vs underprovisioning"],
          ["Figure 4.26", "InterGrid", "IGG-based cloud resource deployment across sites"],
          ["Figure 4.27", "VM Manager", "VM manager service with OpenNebula, EC2, Grid'5000"],
        ]
      ),

      h2("Module 4 – Diagrams"),
      makeTable(
        ["Figure", "Topic", "What It Shows"],
        [
          ["Figure 11.3", "VM Security", "Type A: VMM-based security; Type B: Dedicated Security VM with TCB"],
          ["Figure 11.4", "Xen/Dom0 Architecture", "Management OS (Dom0) with Xen hypervisor on x86 hardware"],
          ["Figure 11.5", "Xoar Components", "All Xoar component types: permanent, self-destructing, request, timer"],
          ["Figure 11.6", "Xoar Sharing", "How two VMs share only XenStore; private BlkBack, NetBack, Toolstack"],
        ]
      ),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 360, after: 120 },
        children: [new TextRun({ text: "— END OF IAT-2 STUDY NOTES —", bold: true, size: 24, font: "Arial", color: "888888" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("./BIS613D_IAT2_Study_Notes.docx", buffer);
  console.log('Done!');
});