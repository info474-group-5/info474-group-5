// viz_rq1_aggression_scatter.js
// RQ1B – "Serve Trajectories": Aggressive Serving vs Serve Dominance

(function () {
  const Viz = {
    table: null,
    initialized: false,

    margin: { top: 50, right: 200, bottom: 40, left: 40 },
    chartW: 0,
    chartH: 0,

    tours: ["ATP", "WTA"],
    colors: {},
    series: {},   // { ATP: [{ year, aces, dom, x, y }], ... }

    hoverPoint: null,

    ensureInit(p) {
      if (this.initialized) return;

      this.chartW = p.width - this.margin.left - this.margin.right;
      this.chartH = p.height - this.margin.top - this.margin.bottom;

      this.colors["ATP"] = p.color(30, 115, 190);
      this.colors["WTA"] = p.color(188, 70, 155);

      this.table = p.loadTable(
        "data/processed/rqx_aggression_by_year.csv",
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

      const byTour = { ATP: [], WTA: [] };

      for (let r = 0; r < this.table.getRowCount(); r++) {
        const year = parseInt(this.table.getString(r, "year"));
        const tour = this.table.getString(r, "tour");
        const aces100 = parseFloat(this.table.getString(r, "aces_per_100_points"));
        const domPct = parseFloat(this.table.getString(r, "serve_dom_index"));

        if (!year || isNaN(aces100) || isNaN(domPct)) continue;
        if (!(tour in byTour)) continue;

        byTour[tour].push({
          year,
          aces: aces100,
          dom: domPct
        });
      }

      for (let t of this.tours) {
        byTour[t].sort((a, b) => a.year - b.year);
      }

      this.series = byTour;
    },

    draw(p, manager, ai, progress) {
      this.ensureInit(p);

      if (!this.table || !Object.keys(this.series).length) {
        p.background(245);
        p.fill(80);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(20);
        p.text("Loading serve aggression data…", 40, 40);
        return;
      }

      p.background(245);

      p.push();
      p.translate(this.margin.left, this.margin.top);

      // 1) Draw court as background canvas
      this.drawCourt(p);

      // 2) Compute global ranges for aces & dominance
      let xs = [], ys = [];
      for (let t of this.tours) {
        xs = xs.concat(this.series[t].map(d => d.aces));
        ys = ys.concat(this.series[t].map(d => d.dom));
      }

      let xMin = Math.min(...xs), xMax = Math.max(...xs);
      let yMin = Math.min(...ys), yMax = Math.max(...ys);
      const xPad = (xMax - xMin) * 0.1 || 0.2;
      const yPad = (yMax - yMin) * 0.1 || 0.2;
      xMin -= xPad; xMax += xPad;
      yMin -= yPad; yMax += yPad;

      // Map data into "performance rectangle" on the court
      const perf = this.performanceRect();

      // Pre-map positions
      for (let t of this.tours) {
        for (let d of this.series[t]) {
          const u = (d.aces - xMin) / (xMax - xMin || 1);   // 0–1
          const v = (d.dom - yMin) / (yMax - yMin || 1);    // 0–1
          d.x = perf.x + u * perf.w;
          // invert v because higher dom should be "higher" on canvas
          d.y = perf.y + (1 - v) * perf.h;
        }
      }

      // 3) Determine animation phase via scroll progress
      const years = this.getAllYears();
      const idx = Math.round(
        p.constrain(p.lerp(0, years.length - 1, progress || 0), 0, years.length - 1)
      );
      const currentYear = years[idx];

      // 4) Draw grid / axes for performance box
      this.drawPerfGrid(p, perf, xMin, xMax, yMin, yMax);

      // 5) Draw trajectories & points
      this.hoverPoint = null;
      let bestDist = 16;

      for (let t of this.tours) {
        const data = this.series[t];
        if (!data.length) continue;

        const col = this.colors[t];

        // Path line
        p.noFill();
        p.stroke(col);
        p.strokeWeight(2);
        p.beginShape();
        for (let d of data) {
          p.vertex(d.x, d.y);
        }
        p.endShape();

        // Moving ball along path based on currentYear
        const { bx, by } = this.interpolateOnPath(p, data, currentYear);
        p.noStroke();
        p.fill(p.red(col), p.green(col), p.blue(col), 230);
        p.ellipse(bx, by, 14, 14);
        p.fill(255, 240);
        p.ellipse(bx, by, 6, 6);

        // Static points + hover detection
        for (let d of data) {
          const r = (d.year % 5 === 0) ? 5 : 3;
          const dist = p.dist(
            p.mouseX - this.margin.left,
            p.mouseY - this.margin.top,
            d.x, d.y
          );
          if (dist < bestDist) {
            bestDist = dist;
            this.hoverPoint = { tour: t, ...d };
          }

          p.noStroke();
          p.fill(p.red(col), p.green(col), p.blue(col), 180);
          p.ellipse(d.x, d.y, r * 2, r * 2);

          if (d.year === 2000 || d.year === 2010 || d.year === 2020) {
            p.fill(250);
            p.textSize(10);
            p.textAlign(p.LEFT, p.CENTER);
            p.text(d.year, d.x + 6, d.y - 10);
          }
        }
      }

      // 6) Hover tooltip
      if (this.hoverPoint) {
        const pt = this.hoverPoint;
        const col = this.colors[pt.tour];

        p.noStroke();
        p.fill(255, 250);
        p.ellipse(pt.x, pt.y, 16, 16);
        p.fill(col);
        p.ellipse(pt.x, pt.y, 10, 10);

        const lines = [
          `${pt.tour} – ${pt.year}`,
          `Aces per 100 serve points: ${pt.aces.toFixed(2)}`,
          `Serve dominance: ${pt.dom.toFixed(2)}%`
        ];
        this.drawTooltip(
          p,
          pt.x + this.margin.left,
          pt.y + this.margin.top - 12,
          lines
        );
      }

      // 7) Title & legend
      this.drawTitleLegend(p, currentYear);

      p.pop();
    },

    drawCourt(p) {
      const cx0 = 0;
      const cy0 = 0;
      const cw = this.chartW * 0.9;
      const ch = this.chartH;

      p.noStroke();
      p.fill(30, 120, 60);
      p.rect(cx0, cy0, cw, ch, 8);

      p.stroke(245);
      p.strokeWeight(2);
      p.noFill();
      p.rect(cx0 + 20, cy0 + 20, cw - 40, ch - 40);

      const netY = cy0 + ch / 2;
      p.line(cx0 + 20, netY, cx0 + cw - 20, netY);

      const serviceY1 = cy0 + ch / 4 + 10;
      const serviceY2 = cy0 + (3 * ch) / 4 - 10;
      p.line(cx0 + 20, serviceY1, cx0 + cw - 20, serviceY1);
      p.line(cx0 + 20, serviceY2, cx0 + cw - 20, serviceY2);

      p.line(cx0 + cw / 2, cy0 + 20, cx0 + cw / 2, cy0 + ch - 20);

      p.noStroke();
      p.fill(255, 230);
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Serve performance zone", cx0 + cw / 2, cy0 + 26);
    },

    // Rect where we plot aces vs dominance, inside the court
    performanceRect() {
      const cx0 = 0;
      const cy0 = 0;
      const cw = this.chartW * 0.9;
      const ch = this.chartH;

      const padX = 60;
      const padY = 60;
      return {
        x: cx0 + padX,
        y: cy0 + padY,
        w: cw - padX * 2,
        h: ch - padY * 2
      };
    },

    drawPerfGrid(p, perf, xMin, xMax, yMin, yMax) {
      p.stroke(230);
      p.strokeWeight(1);
      p.fill(255, 210);
      p.rect(perf.x, perf.y, perf.w, perf.h, 6);

      p.textSize(11);
      p.fill(50);

      // x-axis ticks
      const xticks = 4;
      p.textAlign(p.CENTER, p.TOP);
      for (let i = 0; i <= xticks; i++) {
        const t = i / xticks;
        const v = xMin + t * (xMax - xMin);
        const xx = perf.x + t * perf.w;
        const yy = perf.y + perf.h;

        p.stroke(220);
        p.line(xx, perf.y, xx, perf.y + perf.h);
        p.noStroke();
        p.text(v.toFixed(1), xx, yy + 4);
      }

      // y-axis ticks
      const yticks = 4;
      p.textAlign(p.RIGHT, p.CENTER);
      for (let i = 0; i <= yticks; i++) {
        const t = i / yticks;
        const v = yMin + t * (yMax - yMin);
        const xx = perf.x;
        const yy = perf.y + (1 - t) * perf.h;

        p.stroke(220);
        p.line(perf.x, yy, perf.x + perf.w, yy);
        p.noStroke();
        p.text(v.toFixed(1) + "%", xx - 6, yy);
      }

      // axis labels
      p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      p.text("Aces per 100 serve points", perf.x + perf.w / 2, perf.y + perf.h + 28);

      p.push();
      p.translate(perf.x - 50, perf.y + perf.h / 2);
      p.rotate(-p.HALF_PI);
      p.text("Serve dominance (% of points won on serve)", 0, 0);
      p.pop();
    },

    getAllYears() {
      // union of all years across tours
      const set = new Set();
      for (let t of this.tours) {
        for (let d of this.series[t]) {
          set.add(d.year);
        }
      }
      return Array.from(set).sort((a, b) => a - b);
    },

    // Given ordered data for one tour, return position for animated ball
    interpolateOnPath(p, data, currentYear) {
      if (data.length === 1) {
        return { bx: data[0].x, by: data[0].y };
      }

      // find segment containing or just before currentYear
      let idx = 0;
      for (let i = 0; i < data.length - 1; i++) {
        if (currentYear >= data[i].year && currentYear <= data[i + 1].year) {
          idx = i;
          break;
        }
        if (currentYear > data[i + 1].year) {
          idx = i + 1;
        }
      }

      const a = data[idx];
      const b = data[Math.min(idx + 1, data.length - 1)];

      const span = Math.max(1, b.year - a.year);
      let t = (currentYear - a.year) / span;

      // add a little local animation wiggle
      t = p.constrain(t, 0, 1);
      const wiggle = 0.03 * Math.sin(p.millis() / 300);
      t = p.constrain(t + wiggle, 0, 1);

      const bx = p.lerp(a.x, b.x, t);
      const by = p.lerp(a.y, b.y, t);

      return { bx, by };
    },

    drawTitleLegend(p, currentYear) {
      const cw = this.chartW * 0.9;

      // Title
      p.noStroke();
      p.fill(20);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(18);
      p.text("RQ1B – Serve Trajectories: Aggression vs. Effectiveness", 0, -40);

      // Legend & current year
      p.textSize(12);
      p.textAlign(p.RIGHT, p.BOTTOM);

      const lines = [
        `Current year (animation anchor): ${currentYear}`,
        `ATP trajectory`,
        `WTA trajectory`
      ];

      let yy = -40;
      for (let i = 0; i < lines.length; i++) {
        const txt = lines[i];

        if (i === 1) {
          p.fill(this.colors["ATP"]);
        } else if (i === 2) {
          p.fill(this.colors["WTA"]);
        } else {
          p.fill(40);
        }
        p.text(txt, cw + 160, yy);
        yy += 16;
      }
    },

    drawTooltip(p, sx, sy, lines) {
      const padding = 6;
      p.textSize(11);
      let w = 0;
      for (let t of lines) w = Math.max(w, p.textWidth(t));
      const h = lines.length * 14;

      let x = sx + 12;
      let y = sy - h - 18;
      if (x + w + padding * 2 > p.width) x = p.width - w + padding * 2 - 5;
      if (y < 10) y = sy + 10;

      p.noStroke();
      p.fill(255, 245);
      p.rect(x, y, w + padding * 2, h + padding * 2, 6);

      p.fill(30);
      p.textAlign(p.LEFT, p.TOP);
      let ty = y + padding;
      for (let t of lines) {
        p.text(t, x + padding, ty);
        ty += 14;
      }
    }
  };

  window.VizRQ1_AggScatter = Viz;
})();
