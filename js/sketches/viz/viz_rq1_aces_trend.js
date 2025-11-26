// viz_rq1_aces_trend.js
// RQ1A – "Serving Evolution Court": Aces per Match Over Time (ATP vs WTA)

(function () {
  const Viz = {
    table: null,
    initialized: false,

    margin: { top: 50, right: 200, bottom: 40, left: 40 },
    chartW: 0,
    chartH: 0,

    years: [],
    tours: ["ATP", "WTA"],
    colors: {},
    // per tour per year numeric value
    series: {}, // { ATP: [{ year, value }], WTA: [...] }
    // per tour per year, precomputed impact points on the court
    impacts: {}, // { ATP: {year: [{x,y,intensity}, ...]}, WTA: {...} }

    hoverYear: null,

    ensureInit(p) {
      if (this.initialized) return;

      this.chartW = p.width - this.margin.left - this.margin.right;
      this.chartH = p.height - this.margin.top - this.margin.bottom;

      this.colors["ATP"] = p.color(30, 115, 190);
      this.colors["WTA"] = p.color(188, 70, 155);

      this.table = p.loadTable(
        "data/processed/rqx_aces_by_year.csv",
        "csv",
        "header",
        (t) => {
          this.table = t;
          this.processData();
        }
      );

      this.initialized = true;
    },

    processData() {
      if (!this.table) return;

      const yearsSet = new Set();
      const byTour = { ATP: [], WTA: [] };

      for (let r = 0; r < this.table.getRowCount(); r++) {
        const year = parseInt(this.table.getString(r, "year"));
        const tour = this.table.getString(r, "tour");
        const aces = parseFloat(this.table.getString(r, "aces_per_match"));

        if (!year || isNaN(aces)) continue;
        if (!(tour in byTour)) continue;

        yearsSet.add(year);
        byTour[tour].push({ year, value: aces });
      }

      this.years = Array.from(yearsSet).sort((a, b) => a - b);

      for (let t of this.tours) {
        byTour[t].sort((a, b) => a.year - b.year);
      }

      this.series = byTour;
      this.buildImpacts();
    },

    // Precompute random "serve impact" positions on the court for each year/tour
    buildImpacts() {
      const impacts = { ATP: {}, WTA: {} };

      // global min/max for scaling intensity
      let allVals = [];
      for (let t of this.tours) {
        allVals = allVals.concat(this.series[t].map(d => d.value));
      }
      if (!allVals.length) {
        this.impacts = impacts;
        return;
      }
      const vMin = Math.min(...allVals);
      const vMax = Math.max(...allVals) || vMin + 1;

      // We'll fill the *deuce* service box on the near side for ATP
      // and the *deuce* box on the far side for WTA
      for (let t of this.tours) {
        const tourColor = this.colors[t];
        const tourMap = {};
        for (let d of this.series[t]) {
          const year = d.year;
          const norm = (d.value - vMin) / (vMax - vMin); // 0–1
          const count = 10 + Math.round(norm * 20);      // number of impacts
          const yearImpacts = [];

          for (let i = 0; i < count; i++) {
            // random position within that tour's service box
            const pos = this.randomImpactInCourt(tourColor, t);
            yearImpacts.push({
              x: pos.x,
              y: pos.y,
              intensity: 0.4 + norm * 0.6 // alpha scale
            });
          }
          tourMap[year] = yearImpacts;
        }
        impacts[t] = tourMap;
      }

      this.impacts = impacts;
    },

    // Helper: choose a random point inside the tour's service box
    randomImpactInCourt(col, tour) {
      // Court logical coords (0..1 width, 0..1 height) before scaling
      // We'll map logical coords to the drawn court area later.
      // We'll treat the court rectangle as [cx0,cx1] x [cy0,cy1] in logical.
      // Near baseline at cy1, far baseline at cy0.

      // Service boxes: split lengthwise into 4 boxes.
      // We'll use deuce side: right half of each half.
      // For ATP: near half; for WTA: far half.

      let x0 = 0.5; // middle (deuce side)
      let x1 = 1.0;
      let y0, y1;

      if (tour === "ATP") {
        // near half (bottom)
        y0 = 0.5;
        y1 = 1.0;
      } else {
        // WTA – far half (top)
        y0 = 0.0;
        y1 = 0.5;
      }

      const u = Math.random();
      const v = Math.random();

      return {
        x: x0 + (x1 - x0) * u,
        y: y0 + (y1 - y0) * v
      };
    },

    draw(p, manager, ai, progress) {
      this.ensureInit(p);

      if (!this.table || !this.years.length || !Object.keys(this.impacts.ATP || {}).length) {
        p.background(245);
        p.fill(80);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(20);
        p.text("Loading serving evolution…", 40, 40);
        return;
      }

      p.background(245);

      p.push();
      p.translate(this.margin.left, this.margin.top);

      // 1) Draw tennis court
      this.drawCourt(p);

      // 2) Determine current year from scroll progress (0→1 over the section)
      const idx = Math.round(
        p.constrain(p.lerp(0, this.years.length - 1, progress || 0), 0, this.years.length - 1)
      );
      const currentYear = this.years[idx];

      // Also support hover over top timeline
      const hover = this.getHoverYear(p);
      const activeYear = hover != null ? hover : currentYear;

      // 3) Draw older years as faint impacts, active year as bright/pulsing
      const t = p.millis() / 600.0; // for simple pulsing

      for (let tour of this.tours) {
        const col = this.colors[tour];
        const tourImp = this.impacts[tour];

        for (let y of this.years) {
          const impacts = tourImp[y];
          if (!impacts) continue;

          const isActive = (y === activeYear);
          const age = this.years.indexOf(y) / (this.years.length - 1); // 0 (oldest)–1 (newest)

          for (let imp of impacts) {
            const pos = this.mapToCourt(p, imp.x, imp.y);
            const pulse = isActive ? (1 + 0.3 * Math.sin(t * 2 * Math.PI)) : 1;
            const baseAlpha = isActive ? 200 : p.map(age, 0, 1, 40, 140);
            const alpha = baseAlpha * imp.intensity * pulse;

            p.noStroke();
            p.fill(p.red(col), p.green(col), p.blue(col), alpha);
            const r = isActive ? 10 : 6;
            p.ellipse(pos.x, pos.y, r, r);
          }
        }
      }

      // 4) Draw timeline + labels
      this.drawTimeline(p, activeYear);
      this.drawTitleLegend(p, activeYear);

      p.pop();
    },

    // Map logical (0..1) coords to actual court area on screen
    mapToCourt(p, u, v) {
      // Reserve most of chart area for court
      const cx0 = 0;
      const cy0 = 0;
      const cw = this.chartW * 0.9;
      const ch = this.chartH;

      return {
        x: cx0 + u * cw,
        y: cy0 + v * ch
      };
    },

    drawCourt(p) {
      const cx0 = 0;
      const cy0 = 0;
      const cw = this.chartW * 0.9;
      const ch = this.chartH;

      // base
      p.noStroke();
      p.fill(30, 120, 60);
      p.rect(cx0, cy0, cw, ch, 8);

      p.stroke(245);
      p.strokeWeight(2);

      // outer lines
      p.noFill();
      p.rect(cx0 + 20, cy0 + 20, cw - 40, ch - 40);

      // net
      const netY = cy0 + ch / 2;
      p.line(cx0 + 20, netY, cx0 + cw - 20, netY);

      // center line
      p.line(cx0 + cw / 2, cy0 + 20, cx0 + cw / 2, cy0 + ch - 20);

      // service lines
      const serviceY1 = cy0 + ch / 4 + 10;
      const serviceY2 = cy0 + (3 * ch) / 4 - 10;
      p.line(cx0 + 20, serviceY1, cx0 + cw - 20, serviceY1);
      p.line(cx0 + 20, serviceY2, cx0 + cw - 20, serviceY2);

      // subtle labels "WTA serves" (top) and "ATP serves" (bottom)
      p.noStroke();
      p.fill(255, 230);
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.text("WTA serve impacts", cx0 + cw * 0.75, cy0 + 26);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text("ATP serve impacts", cx0 + cw * 0.75, cy0 + ch - 26);
    },

    getHoverYear(p) {
      const timelineY = -20; // above court
      const x0 = 0;
      const x1 = this.chartW * 0.9;

      const mx = p.mouseX - this.margin.left;
      const my = p.mouseY - this.margin.top;

      if (my < timelineY - 20 || my > timelineY + 20) return null;
      if (mx < x0 || mx > x1) return null;

      const t = (mx - x0) / (x1 - x0);
      const idx = Math.round(t * (this.years.length - 1));
      return this.years[Math.max(0, Math.min(this.years.length - 1, idx))];
    },

    drawTimeline(p, activeYear) {
      const x0 = 0;
      const x1 = this.chartW * 0.9;
      const y = -20;

      p.stroke(180);
      p.strokeWeight(1.5);
      p.line(x0, y, x1, y);

      p.textAlign(p.CENTER, p.TOP);
      p.textSize(11);
      p.noStroke();
      p.fill(60);

      const nTicks = Math.min(this.years.length, 8);
      for (let i = 0; i < nTicks; i++) {
        const t = i / (nTicks - 1);
        const idx = Math.round(t * (this.years.length - 1));
        const year = this.years[idx];
        const xx = p.lerp(x0, x1, t);

        p.stroke(180);
        p.line(xx, y - 4, xx, y + 4);
        p.noStroke();
        p.text(year, xx, y + 6);
      }

      // active year marker
      const idx = this.years.indexOf(activeYear);
      if (idx >= 0) {
        const t = idx / (this.years.length - 1 || 1);
        const xx = p.lerp(x0, x1, t);
        p.noStroke();
        p.fill(50, 180, 255);
        p.circle(xx, y, 8);
      }
    },

    drawTitleLegend(p, activeYear) {
      const cw = this.chartW * 0.9;

      // Title
      p.noStroke();
      p.fill(20);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(18);
      p.text("RQ1A – Serving Evolution: Aces per Match Over Time", 0, -40);

      // Active year + values
      const lines = [];
      lines.push(`Year: ${activeYear}`);

      for (let t of this.tours) {
        const d = this.series[t].find(d => d.year === activeYear);
        if (d) {
          lines.push(`${t}: ${d.value.toFixed(2)} aces per match`);
        }
      }

      p.textAlign(p.RIGHT, p.BOTTOM);
      p.textSize(12);
      let yy = -40;
      for (let i = 0; i < lines.length; i++) {
        const text = lines[i];
        if (i === 0) {
          p.fill(30);
        } else {
          const tour = text.startsWith("ATP") ? "ATP" : (text.startsWith("WTA") ? "WTA" : null);
          p.fill(tour ? this.colors[tour] : p.color(80));
        }
        p.text(text, cw + 160, yy);
        yy += 16;
      }
    }
  };

  window.VizRQ1_AcesTrend = Viz;
})();
