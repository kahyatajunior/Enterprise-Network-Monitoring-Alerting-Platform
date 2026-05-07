const devices = [
  { name: "dc-core-01", type: "network", role: "Core Router", ip: "10.0.0.1", cpu: 51, ram: 64, disk: 42, latency: 8, loss: 0.1, status: "online" },
  { name: "edge-fw-02", type: "network", role: "Firewall", ip: "10.0.0.2", cpu: 78, ram: 71, disk: 38, latency: 14, loss: 0.4, status: "online" },
  { name: "sw-floor-7", type: "network", role: "Access Switch", ip: "10.7.0.10", cpu: 47, ram: 55, disk: 29, latency: 18, loss: 0.8, status: "online" },
  { name: "srv-auth-01", type: "server", role: "Identity Server", ip: "10.1.2.20", cpu: 69, ram: 82, disk: 63, latency: 11, loss: 0.2, status: "online" },
  { name: "srv-db-03", type: "server", role: "PostgreSQL", ip: "10.1.2.33", cpu: 86, ram: 88, disk: 74, latency: 16, loss: 0.4, status: "warning" },
  { name: "srv-cache-01", type: "server", role: "Redis", ip: "10.1.2.44", cpu: 44, ram: 58, disk: 31, latency: 9, loss: 0.1, status: "online" },
  { name: "printer-hq-3", type: "printer", role: "Finance Printer", ip: "10.4.8.25", cpu: 18, ram: 35, disk: 22, latency: 33, loss: 2.1, status: "warning" },
  { name: "wan-lusaka", type: "network", role: "Branch Link", ip: "172.16.8.1", cpu: 91, ram: 67, disk: 40, latency: 86, loss: 4.8, status: "critical" }
];

const alerts = [
  ["critical", "wan-lusaka packet loss exceeded 4%", "SMS simulation sent to on-call engineer"],
  ["critical", "srv-db-03 RAM pressure above threshold", "Escalation rule: DBA team after 10 minutes"],
  ["warning", "printer-hq-3 intermittently unreachable", "Ping check failed twice in 5 minutes"],
  ["info", "dc-core-01 SNMP poll completed", "Interface counters updated"]
];

const incidents = [
  ["INC-1048", "WAN packet loss", "Assigned: T. Banda", "Root cause pending"],
  ["INC-1045", "Database memory pressure", "Assigned: M. Phiri", "Query burst isolated"],
  ["INC-1039", "Printer offline", "Assigned: J. Moyo", "Driver queue restarted"]
];

const resources = [
  ["prod-api-01", "VM", "running", "4 vCPU / 16 GB"],
  ["prod-db-volume", "Storage", "attached", "2 TB encrypted"],
  ["net-prod-east", "Network", "active", "3 subnets / 2 routes"],
  ["k8s-ops", "Cluster", "healthy", "8 nodes / 46 pods"]
];

const clusters = [
  ["control-plane", "3/3 ready", 82],
  ["worker-pool-a", "5/5 ready", 67],
  ["ingress-nginx", "2 replicas", 41],
  ["alertmanager", "1 replica", 54]
];

const timeline = [
  ["Build", "Container image pushed to registry"],
  ["Deploy", "Blue environment receiving 15% traffic"],
  ["Verify", "Synthetic checks passing"],
  ["Promote", "Awaiting approval for production"]
];

const chartSeries = {
  cpu: Array.from({ length: 48 }, () => randomBetween(35, 86)),
  ram: Array.from({ length: 48 }, () => randomBetween(42, 90)),
  disk: Array.from({ length: 48 }, () => randomBetween(30, 76)),
  bandwidth: Array.from({ length: 48 }, () => randomBetween(20, 95))
};

let activeFilter = "all";
let alertSuppressed = false;
let eventCount = 0;

const $ = (selector) => document.querySelector(selector);

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function statusClass(device) {
  if (device.status === "critical" || device.cpu > 88 || device.loss > 4) return "bad";
  if (device.status === "warning" || device.cpu > 78 || device.ram > 82 || device.loss > 1.5) return "warn";
  return "good";
}

function renderDevices() {
  const grid = $("#deviceGrid");
  grid.innerHTML = "";
  devices
    .filter((device) => activeFilter === "all" || device.type === activeFilter)
    .forEach((device) => {
      const state = statusClass(device);
      const card = document.createElement("article");
      card.className = "device-card";
      card.innerHTML = `
        <header>
          <div>
            <h3>${device.name}</h3>
            <p>${device.role} · ${device.ip}</p>
          </div>
          <span class="status-dot ${state}"></span>
        </header>
        <div class="meter ${state === "good" ? "" : state}"><span style="width:${device.cpu}%"></span></div>
        <div class="device-stats">
          <span>CPU ${device.cpu}%</span>
          <span>RAM ${device.ram}%</span>
          <span>Disk ${device.disk}%</span>
          <span>${device.latency}ms / ${device.loss.toFixed(1)}%</span>
        </div>
      `;
      grid.appendChild(card);
    });
}

function renderAlerts() {
  const list = $("#alertList");
  list.innerHTML = "";
  alerts.slice(0, 6).forEach(([severity, title, detail]) => {
    const item = document.createElement("article");
    item.className = "event-item";
    item.innerHTML = `
      <span class="severity ${severity}">${severity}</span>
      <span><strong>${title}</strong><small>${detail}</small></span>
      <small>${new Date().toLocaleTimeString()}</small>
    `;
    list.appendChild(item);
  });
}

function renderIncidents() {
  $("#incidentTable").innerHTML = incidents
    .map(([id, title, assignee, rca]) => `
      <article class="incident-row">
        <span><strong>${id}</strong><small>${title}</small></span>
        <span>${assignee}</span>
        <span>${rca}</span>
        <button type="button">Resolve</button>
      </article>
    `)
    .join("");
}

function renderCloud() {
  $("#resourceCards").innerHTML = resources
    .map(([name, kind, state, spec]) => `
      <article class="resource-card">
        <header>
          <div>
            <h4>${name}</h4>
            <p>${kind} · ${spec}</p>
          </div>
          <span class="status-dot ${state === "running" || state === "active" || state === "healthy" ? "good" : "warn"}"></span>
        </header>
        <button type="button">${state === "running" ? "Restart" : "Manage"}</button>
      </article>
    `)
    .join("");

  $("#clusterGrid").innerHTML = clusters
    .map(([name, state, load]) => `
      <article class="cluster-card">
        <strong>${name}</strong>
        <p>${state}</p>
        <div class="meter"><span style="width:${load}%"></span></div>
      </article>
    `)
    .join("");

  $("#deploymentTimeline").innerHTML = timeline
    .map(([title, detail]) => `<li><strong>${title}</strong><span>${detail}</span></li>`)
    .join("");
}

function renderTopology() {
  const nodes = [
    ["Internet", 340, 42, "good"],
    ["Firewall", 340, 112, "good"],
    ["Core", 340, 188, "good"],
    ["DB", 156, 304, "warn"],
    ["Auth", 304, 304, "good"],
    ["Cache", 448, 304, "good"],
    ["Branch", 594, 304, "bad"]
  ];
  const links = [
    [0, 1, false],
    [1, 2, false],
    [2, 3, false],
    [2, 4, false],
    [2, 5, false],
    [2, 6, true]
  ];
  const svg = $("#topologyMap");
  svg.innerHTML = "";

  links.forEach(([from, to, hot]) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", nodes[from][1]);
    line.setAttribute("y1", nodes[from][2]);
    line.setAttribute("x2", nodes[to][1]);
    line.setAttribute("y2", nodes[to][2]);
    line.setAttribute("class", `topology-link ${hot ? "hot" : ""}`);
    svg.appendChild(line);
  });

  nodes.forEach(([label, x, y, state]) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", `topology-node ${state}`);
    group.innerHTML = `<circle cx="${x}" cy="${y}" r="25"></circle><text x="${x}" y="${y + 48}">${label}</text>`;
    svg.appendChild(group);
  });
}

function drawChart() {
  const canvas = $("#metricsChart");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#1d2a39";
  ctx.lineWidth = 1;
  for (let y = 40; y < height; y += 44) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const colors = { cpu: "#38d6ff", ram: "#22c55e", disk: "#f5b84b", bandwidth: "#a78bfa" };
  Object.entries(chartSeries).forEach(([name, values]) => {
    ctx.beginPath();
    ctx.strokeStyle = colors[name];
    ctx.lineWidth = 3;
    values.forEach((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / 100) * (height - 28) - 12;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
}

function tickMetrics() {
  devices.forEach((device) => {
    device.cpu = clamp(device.cpu + randomBetween(-5, 6), 8, 96);
    device.ram = clamp(device.ram + randomBetween(-3, 4), 18, 96);
    device.disk = clamp(device.disk + randomBetween(-1, 2), 12, 95);
    device.latency = clamp(device.latency + randomBetween(-6, 8), 4, 140);
    device.loss = clamp(device.loss + (Math.random() - 0.46), 0, 8);
  });

  Object.values(chartSeries).forEach((series) => {
    series.push(clamp(series.at(-1) + randomBetween(-8, 9), 10, 96));
    series.shift();
  });

  const avgLatency = Math.round(devices.reduce((sum, d) => sum + d.latency, 0) / devices.length);
  const avgLoss = devices.reduce((sum, d) => sum + d.loss, 0) / devices.length;
  const critical = devices.filter((d) => statusClass(d) === "bad").length + alerts.filter((a) => a[0] === "critical").length;

  $("#latencyValue").textContent = avgLatency;
  $("#lossValue").textContent = avgLoss.toFixed(1);
  $("#criticalCount").textContent = alertSuppressed ? Math.max(0, critical - 2) : critical;
  $("#onlineCount").textContent = devices.filter((d) => statusClass(d) !== "bad").length + 130;
  $("#agentCount").textContent = randomBetween(145, 151);
  $("#fleetBar").style.width = `${randomBetween(82, 94)}%`;

  renderDevices();
  drawChart();
}

function addLog(level, message) {
  const stream = $("#logStream");
  const line = document.createElement("div");
  line.className = "log-line";
  line.innerHTML = `<span>${new Date().toLocaleTimeString()}</span><span>${level}</span><span>${message}</span>`;
  stream.prepend(line);
  eventCount += 1;
  $("#logCount").textContent = eventCount;
  while (stream.children.length > 40) stream.lastElementChild.remove();
}

function rotateTerminal() {
  const target = devices[randomBetween(0, devices.length - 1)];
  const lines = [
    `$ ssh ops@${target.ip}`,
    `connected to ${target.name}`,
    `$ uptime`,
    ` ${randomBetween(8, 400)} days, load average: ${(target.cpu / 40).toFixed(2)}, ${(target.ram / 50).toFixed(2)}, ${(target.disk / 60).toFixed(2)}`,
    `$ systemctl status monitor-agent`,
    ` active (running) - last heartbeat ${randomBetween(1, 12)}s ago`,
    `$ snmpwalk -v2c ${target.ip} ifHCInOctets`,
    ` bandwidth=${randomBetween(120, 940)}Mbps latency=${target.latency}ms loss=${target.loss.toFixed(1)}%`
  ];
  $("#terminalOutput").textContent = lines.join("\n");
}

function generateTerraform() {
  $("#terraformOutput").textContent = `module "prod_api" {
  source      = "./modules/compute"
  name        = "prod-api-${randomBetween(2, 9)}"
  image       = "ubuntu-24.04-lts"
  vcpu        = 4
  memory_gb   = 16
  network_id  = "net-prod-east"
  monitoring  = true
}

resource "ops_alert_rule" "critical_cpu" {
  metric      = "cpu_usage"
  threshold   = 85
  duration    = "5m"
  escalation  = ["email", "sms_simulation", "incident"]
}`;
}

function wireInteractions() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      renderDevices();
    });
  });

  $("#suppressBtn").addEventListener("click", () => {
    alertSuppressed = !alertSuppressed;
    $("#suppressBtn").textContent = alertSuppressed ? "Resume Alerts" : "Suppress Alerts";
    addLog("ALERT", alertSuppressed ? "Suppression rule enabled for noisy branch link" : "Suppression rule disabled");
    tickMetrics();
  });

  $("#scanBtn").addEventListener("click", () => {
    addLog("DISCOVERY", `Network discovery scanned ${randomBetween(180, 260)} addresses and updated topology`);
    $("#topologyStatus").textContent = "Discovery complete";
  });

  $("#escalateBtn").addEventListener("click", () => {
    alerts.unshift(["critical", "Escalation policy triggered", "Email + SMS simulation routed to infrastructure lead"]);
    renderAlerts();
    addLog("ESCALATE", "Critical incident escalated to level 2 support");
  });

  $("#newIncidentBtn").addEventListener("click", () => {
    const id = `INC-${randomBetween(1050, 1099)}`;
    incidents.unshift([id, "Service check failure", "Assigned: Queue", "Investigation started"]);
    renderIncidents();
    addLog("INCIDENT", `${id} opened from failed port check`);
  });

  $("#createVmBtn").addEventListener("click", () => {
    resources.unshift([`dev-vm-${randomBetween(10, 99)}`, "VM", "running", "2 vCPU / 8 GB"]);
    resources.splice(4);
    renderCloud();
    addLog("CLOUD", "Provisioned VM from deployment template");
  });

  $("#rollbackBtn").addEventListener("click", () => {
    timeline.unshift(["Rollback", "Previous deployment restored after health gate failure"]);
    timeline.splice(4);
    renderCloud();
    addLog("DEPLOY", "Rollback completed for blue environment");
  });

  $("#generateTerraformBtn").addEventListener("click", () => {
    generateTerraform();
    addLog("IAC", "Terraform configuration generated from selected environment");
  });
}

function boot() {
  renderDevices();
  renderAlerts();
  renderIncidents();
  renderCloud();
  renderTopology();
  drawChart();
  rotateTerminal();
  generateTerraform();
  wireInteractions();

  ["monitor-agent heartbeat received", "port check tcp/443 passed", "postgres exporter scraped", "printer SNMP toner state updated"].forEach((message) => addLog("INFO", message));

  setInterval(tickMetrics, 1800);
  setInterval(rotateTerminal, 4200);
  setInterval(() => {
    const messages = [
      "ping check completed for branch router",
      "service check nginx returned 200",
      "anomaly detector flagged bandwidth variance",
      "Redis latency within threshold",
      "device state change reconciled"
    ];
    addLog("EVENT", messages[randomBetween(0, messages.length - 1)]);
  }, 3200);
}

boot();
