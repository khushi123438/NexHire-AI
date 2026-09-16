"""
NexHire AI Curated Technical & Behavioral Knowledge Corpus
Multi-domain grounded interview knowledge covering all 6 engineering & technical roles:
1. Software Development Engineer (SDE)
2. Frontend Developer
3. Backend Developer
4. Full Stack Developer
5. Data Scientist / AI Engineer
6. DevOps / Cloud Engineer
"""

CURATED_KNOWLEDGE = [
    # ================= 1. Frontend Development & React =================
    {
        "domain": "Frontend",
        "topic": "React Architecture",
        "subtopic": "Virtual DOM, Reconciliation & Fiber Engine",
        "difficulty": "advanced",
        "contentType": "deepdive",
        "tags": ["React", "Virtual DOM", "Fiber", "Reconciliation", "Diffing", "Concurrent Mode"],
        "text": "React Fiber is an incremental rendering engine breaking work into units executed over time slices. The Virtual DOM maintains an in-memory representation; during reconciliation, the diffing algorithm operates in O(n) using element type comparison and unique 'key' props. React 18 Concurrent Features (useTransition, useDeferredValue) prioritize urgent user interactions (typing/clicks) over background component re-renders."
    },
    {
        "domain": "Frontend",
        "topic": "Web Performance",
        "subtopic": "Core Web Vitals & Asset Optimization",
        "difficulty": "medium",
        "contentType": "concept",
        "tags": ["Web Performance", "LCP", "INP", "CLS", "Code Splitting", "Lazy Loading", "Tree Shaking"],
        "text": "Core Web Vitals quantify user experience: Largest Contentful Paint (LCP for loading under 2.5s), Interaction to Next Paint (INP for responsiveness under 200ms), and Cumulative Layout Shift (CLS for visual stability under 0.1). Frontend performance optimizations include dynamic code splitting with React.lazy/Suspense, image optimization (WebP/AVIF with explicit dimensions), CSS critical path inlining, and tree-shaking unused ES module exports."
    },
    {
        "domain": "Frontend",
        "topic": "JavaScript Internals",
        "subtopic": "Event Loop, Microtasks & Closures",
        "difficulty": "medium",
        "contentType": "concept",
        "tags": ["JavaScript", "Event Loop", "Microtasks", "Macrotasks", "Closures", "Scope Chain"],
        "text": "JavaScript executes on a single-threaded event loop. The call stack executes synchronous code, followed by completely draining the Microtask Queue (Promise callbacks, queueMicrotask) before processing the next Macrotask (setTimeout, I/O). A closure retains lexical scope access even after parent function execution completes, enabling encapsulation and memoization patterns."
    },
    {
        "domain": "Frontend",
        "topic": "CSS & Accessibility",
        "subtopic": "CSS Grid/Flexbox Layouts & ARIA Standards",
        "difficulty": "medium",
        "contentType": "concept",
        "tags": ["CSS", "Flexbox", "Grid", "Accessibility", "a11y", "ARIA", "Responsive Design"],
        "text": "Flexbox handles one-dimensional content alignment along main/cross axes, while CSS Grid manages two-dimensional row and column structures. Web Accessibility (WCAG 2.1) ensures keyboard navigation, sufficient color contrast ratios (4.5:1), semantic HTML (header, main, nav, article), and appropriate WAI-ARIA roles/attributes (aria-expanded, aria-live) for assistive technologies."
    },

    # ================= 2. Backend Development & APIs =================
    {
        "domain": "Backend",
        "topic": "REST API Architecture",
        "subtopic": "Idempotency, Status Codes & Versioning",
        "difficulty": "medium",
        "contentType": "concept",
        "tags": ["REST APIs", "HTTP", "Idempotency", "API Design", "Rate Limiting", "Pagination"],
        "text": "RESTful APIs enforce stateless client-server interactions using standard HTTP methods. GET, PUT, DELETE, and HEAD are idempotent, whereas POST is not. Idempotency keys prevent duplicate processing on network retries. Proper pagination (cursor-based vs offset-based) prevents server memory exhaustion on large datasets. API versioning is typically handled via URI paths (/v1/users) or custom request headers."
    },
    {
        "domain": "Backend",
        "topic": "Database Architecture",
        "subtopic": "ACID Transactions & MVCC Isolation",
        "difficulty": "advanced",
        "contentType": "deepdive",
        "tags": ["DBMS", "SQL", "ACID", "Isolation", "MVCC", "Deadlocks", "Transactions"],
        "text": "ACID transactions guarantee Atomicity, Consistency, Isolation, and Durability. SQL isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) protect against dirty reads, non-repeatable reads, and phantom reads. Modern engines (PostgreSQL, MySQL InnoDB) use Multi-Version Concurrency Control (MVCC) with undo logs to allow concurrent readers without acquiring exclusive table locks on writers."
    },
    {
        "domain": "Backend",
        "topic": "Caching & Message Queues",
        "subtopic": "Redis Strategies & Event-Driven Decoupling",
        "difficulty": "advanced",
        "contentType": "tradeoff",
        "tags": ["Redis", "Caching", "Cache Stampede", "Kafka", "RabbitMQ", "Message Queues"],
        "text": "Distributed caching with Redis employs Cache-Aside, Write-Through, or Write-Back strategies with TTL expiration and LRU/LFU eviction policies. Mitigate cache stampedes (thundering herd) using probabilistic early expiration or distributed mutex locks. Message brokers (Kafka, RabbitMQ) decouple high-latency background operations from synchronous API request-response lifecycles."
    },
    {
        "domain": "Backend",
        "topic": "Authentication & Security",
        "subtopic": "JWT Lifecycles, OAuth2 & OWASP Top 10",
        "difficulty": "advanced",
        "contentType": "scenario",
        "tags": ["Security", "JWT", "OAuth2", "OWASP", "XSS", "CSRF", "SQL Injection"],
        "text": "Stateless JWT authentication pairs short-lived access tokens (stored in memory or secure HTTP-only SameSite cookies) with revocable refresh tokens stored in database/Redis. OWASP defense includes parameterized queries against SQL injection, CSP headers and sanitization against XSS, and anti-CSRF tokens for state-changing browser requests."
    },

    # ================= 3. Data Science & AI Engineering =================
    {
        "domain": "Data Science & AI",
        "topic": "Machine Learning Fundamentals",
        "subtopic": "Bias-Variance Tradeoff & Model Evaluation",
        "difficulty": "medium",
        "contentType": "tradeoff",
        "tags": ["Machine Learning", "Bias-Variance", "Overfitting", "Cross-Validation", "Regularization", "ROC-AUC"],
        "text": "High bias leads to underfitting by failing to capture underlying patterns, while high variance leads to overfitting by fitting training noise. Mitigation strategies include L1 (Lasso for feature sparsity), L2 (Ridge for coefficient shrinkage), Dropout in neural networks, and stratified K-Fold cross-validation. For imbalanced classification, evaluate Precision, Recall, F1-Score, and PR-AUC rather than raw accuracy."
    },
    {
        "domain": "Data Science & AI",
        "topic": "Ensemble Methods",
        "subtopic": "Random Forest vs Gradient Boosting (XGBoost/LightGBM)",
        "difficulty": "advanced",
        "contentType": "tradeoff",
        "tags": ["Machine Learning", "Random Forest", "Gradient Boosting", "XGBoost", "Bagging", "Ensembles"],
        "text": "Random Forest builds independent decision trees in parallel using Bagging (Bootstrap Aggregation) and random feature subsets, primarily reducing variance. Gradient Boosting (XGBoost, LightGBM, CatBoost) builds trees sequentially, with each tree fitting the pseudo-residuals/gradients of the previous ensemble to reduce bias. Gradient boosting requires careful tuning of learning rate, tree depth, and early stopping to prevent overfitting."
    },
    {
        "domain": "Data Science & AI",
        "topic": "Deep Learning & Transformers",
        "subtopic": "Self-Attention Mechanism & Embeddings",
        "difficulty": "advanced",
        "contentType": "deepdive",
        "tags": ["Deep Learning", "Transformers", "Self-Attention", "Embeddings", "LLMs", "NLP"],
        "text": "The Transformer architecture relies on Multi-Head Self-Attention calculating scaled dot-product attention: Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V. This enables parallel token processing across entire sequences, resolving RNN bottleneck issues with long-range dependencies. Dense vector embeddings map semantic concepts into continuous vector spaces where cosine similarity measures conceptual closeness."
    },
    {
        "domain": "Data Science & AI",
        "topic": "Feature Engineering & Data Pipeline",
        "subtopic": "Data Preprocessing, Missing Data & Imputation",
        "difficulty": "medium",
        "contentType": "scenario",
        "tags": ["Pandas", "Feature Engineering", "Data Cleaning", "Imputation", "Encoding", "Scaling"],
        "text": "Data preprocessing pipelines must avoid data leakage by fitting transformers (StandardScaler, OneHotEncoder, SimpleImputer) exclusively on training splits before transforming validation/test sets. Handle missing values based on mechanism (MCAR, MAR, MNAR) using median imputation, KNN imputation, or dedicated indicator flags. Encode high-cardinality categorical variables using Target Encoding or Frequency Encoding."
    },

    # ================= 4. DevOps & Cloud Engineering =================
    {
        "domain": "DevOps & Cloud",
        "topic": "Containerization",
        "subtopic": "Docker Multi-Stage Builds & Layer Caching",
        "difficulty": "medium",
        "contentType": "concept",
        "tags": ["Docker", "Containers", "Multi-Stage Build", "Image Optimization", "Security"],
        "text": "Docker packages applications with their runtime dependencies into isolated containers using Linux cgroups and namespaces. Multi-stage builds separate build dependencies (compilers, build tools) from runtime images, producing lightweight, secure production containers (e.g. Alpine/distroless). Order Dockerfile commands from least to most frequently changing to maximize Docker build layer cache hits."
    },
    {
        "domain": "DevOps & Cloud",
        "topic": "Kubernetes Architecture",
        "subtopic": "Pod Scheduling, Services & Ingress Controllers",
        "difficulty": "advanced",
        "contentType": "deepdive",
        "tags": ["Kubernetes", "K8s", "Pods", "Deployments", "Services", "Ingress", "HorizontalPodAutoscaler"],
        "text": "Kubernetes control plane (API server, etcd, scheduler, controller manager) coordinates worker nodes running kubelet and kube-proxy. Deployments manage replica sets enabling zero-downtime rolling updates. ClusterIP provides internal service discovery, NodePort exposes static ports on all nodes, and Ingress controllers route external HTTP/HTTPS traffic with SSL termination and path-based routing. HPA autoscales pods based on CPU/memory metrics."
    },
    {
        "domain": "DevOps & Cloud",
        "topic": "CI/CD & Infrastructure as Code",
        "subtopic": "Pipeline Automation & Terraform State Management",
        "difficulty": "advanced",
        "contentType": "tradeoff",
        "tags": ["CI/CD", "GitHub Actions", "Jenkins", "Terraform", "IaC", "Blue-Green Deployment"],
        "text": "CI/CD pipelines automate testing, linting, security vulnerability scanning, container builds, and deployments. Deployment strategies include Rolling Updates, Blue-Green (switching traffic to identical standby environment), and Canary deployments (routing fractional traffic to validate stability). Terraform manages Infrastructure as Code (IaC) with declarative HCL, remote backend state locking (S3 + DynamoDB), and drift detection."
    },
    {
        "domain": "DevOps & Cloud",
        "topic": "Linux & Networking",
        "subtopic": "Process Management, Systemd & Networking Troubleshooting",
        "difficulty": "medium",
        "contentType": "concept",
        "tags": ["Linux", "Systemd", "Processes", "TCP/IP", "DNS", "Troubleshooting", "iptables"],
        "text": "Linux process management involves systemd service units, signal handling (SIGTERM for graceful shutdown, SIGKILL for immediate termination), and virtual file systems (/proc, /sys). Network debugging utilizes netstat/ss (socket connections), curl/dig (DNS resolution and HTTP responses), tcpdump (packet inspection), and iptables/ufw (firewall rule enforcement)."
    },

    # ================= 5. Full Stack & Systems Integration =================
    {
        "domain": "Full Stack",
        "topic": "Full Stack Architecture",
        "subtopic": "Client-Server Sync, WebSockets & SSR vs CSR",
        "difficulty": "advanced",
        "contentType": "tradeoff",
        "tags": ["Full Stack", "WebSockets", "SSR", "CSR", "GraphQL", "MERN", "Microservices"],
        "text": "Full stack architecture balances client-side rendering (CSR for interactive single-page applications) with server-side rendering (SSR for fast initial paint and SEO indexing). Real-time bidirectional communication uses WebSockets with heartbeat keep-alives and reconnection backoff. Optimistic UI updates provide immediate feedback while synchronizing state with backend REST/GraphQL responses in the background."
    },

    # ================= 6. Software Development Engineer (SDE Core) =================
    {
        "domain": "SDE Core",
        "topic": "Data Structures & Algorithms",
        "subtopic": "Space-Time Complexities & Graph Traversals",
        "difficulty": "advanced",
        "contentType": "concept",
        "tags": ["DSA", "Complexity", "Big-O", "Graphs", "BFS", "DFS", "Trees", "Dynamic Programming"],
        "text": "Algorithmic complexity evaluates worst, average, and amortized space and time bounds. Hash tables provide O(1) average lookup but can degrade to O(n) under collisions without balanced bucket treeification. Breadth-First Search (BFS) finds shortest paths in unweighted graphs using queues, while Depth-First Search (DFS) powers topological sorting and cycle detection. Dynamic programming eliminates redundant overlapping subproblem computations."
    },
    {
        "domain": "SDE Core",
        "topic": "Distributed System Design",
        "subtopic": "CAP Theorem, Sharding & Rate Limiting",
        "difficulty": "hard",
        "contentType": "deepdive",
        "tags": ["System Design", "CAP Theorem", "Sharding", "Consistent Hashing", "Rate Limiting", "Load Balancing"],
        "text": "CAP theorem establishes that under network partitions (P), distributed data stores must trade off Consistency (C) vs Availability (A). Database sharding distributes large tables across nodes using hash or range shard keys. Consistent hashing minimizes remapped keys when cache/database nodes scale. Token Bucket and Sliding Window log algorithms enforce rate limits to protect upstream services from traffic surges."
    },

    # ================= 7. HR, Leadership & Behavioral =================
    {
        "domain": "HR & Behavioral",
        "topic": "Behavioral Evaluation",
        "subtopic": "STAR Framework & Engineering Conflict Resolution",
        "difficulty": "medium",
        "contentType": "scenario",
        "tags": ["HR", "Behavioral", "STAR", "Leadership", "Ownership", "Conflict Resolution", "Culture"],
        "text": "The STAR framework structures behavioral answers: Situation (background context), Task (challenge/objective), Action (specific technical decisions and initiatives candidate took), and Result (quantified metrics, impact, and learnings). When navigating technical disagreements with peers or leads: ground discussions in data and architecture benchmarks, communicate trade-offs transparently, align with organizational objectives, and commit wholeheartedly ('Disagree and Commit')."
    }
]
