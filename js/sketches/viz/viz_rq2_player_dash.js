
// Player Dashboard: Simple List + Detail View
(function () {
  const Viz = {
    selectedPlayer: null,
    playerPhotos: {},
    initialized: false,

    // One flat list of players (add/remove as you like)
    playerOrder: [
      "federer",
      "nadal",
      "djokovic",
      "alcaraz",
      "sinner",
      "serena",
      "henin",
      "swiatek",
      "sabalenka",
      "gauff"
    ],

    playerData: {
      federer: {
        name: "Roger Federer",
        tour: "ATP",
        careerWinPct: 82.2,
        grandSlamTitles: 20,
        peakRanking: 1,
        serveEfficiency: 78.5,
        returnGamesWon: 34.2,
        breakPointConversion: 41.3,
        color: null,
        photoUrl: "photos/federer.jpg"
      },
      nadal: {
        name: "Rafael Nadal",
        tour: "ATP",
        careerWinPct: 83.3,
        grandSlamTitles: 22,
        peakRanking: 1,
        serveEfficiency: 73.8,
        returnGamesWon: 38.5,
        breakPointConversion: 44.7,
        color: null,
        photoUrl: "photos/nadal.jpg"
      },
      djokovic: {
        name: "Novak Djokovic",
        tour: "ATP",
        careerWinPct: 83.5,
        grandSlamTitles: 24,
        peakRanking: 1,
        serveEfficiency: 76.2,
        returnGamesWon: 40.1,
        breakPointConversion: 45.2,
        color: null,
        photoUrl: "photos/djokovic.jpg"
      },
      alcaraz: {
        name: "Carlos Alcaraz",
        tour: "ATP",
        careerWinPct: 77.8,
        grandSlamTitles: 4,
        peakRanking: 1,
        serveEfficiency: 75.3,
        returnGamesWon: 36.8,
        breakPointConversion: 43.1,
        color: null,
        photoUrl: "photos/alcaraz.jpg"
      },
      sinner: {
        name: "Jannik Sinner",
        tour: "ATP",
        careerWinPct: 74.5,
        grandSlamTitles: 2,
        peakRanking: 1,
        serveEfficiency: 77.1,
        returnGamesWon: 37.2,
        breakPointConversion: 42.5,
        color: null,
        photoUrl: "photos/sinner.jpg"
      },
      serena: {
        name: "Serena Williams",
        tour: "WTA",
        careerWinPct: 85.6,
        grandSlamTitles: 23,
        peakRanking: 1,
        serveEfficiency: 79.4,
        returnGamesWon: 40.0,
        breakPointConversion: 44.0,
        color: null,
        photoUrl: "photos/serena.jpg"
      },
      henin: {
        name: "Justine Henin",
        tour: "WTA",
        careerWinPct: 81.2,
        grandSlamTitles: 7,
        peakRanking: 1,
        serveEfficiency: 72.0,
        returnGamesWon: 39.5,
        breakPointConversion: 45.5,
        color: null,
        photoUrl: "photos/henin.jpg"
      },
      swiatek: {
        name: "Iga Swiatek",
        tour: "WTA",
        careerWinPct: 81.0,
        grandSlamTitles: 5,
        peakRanking: 1,
        serveEfficiency: 74.5,
        returnGamesWon: 42.0,
        breakPointConversion: 46.0,
        color: null,
        photoUrl: "photos/swiatek.jpg"
      },
      sabalenka: {
        name: "Aryna Sabalenka",
        tour: "WTA",
        careerWinPct: 70.0,
        grandSlamTitles: 3,
        peakRanking: 1,
        serveEfficiency: 76.0,
        returnGamesWon: 35.0,
        breakPointConversion: 42.0,
        color: null,
        photoUrl: "photos/sabalenka.jpg"
      },
      gauff: {
        name: "Coco Gauff",
        tour: "WTA",
        careerWinPct: 68.0,
        grandSlamTitles: 1,
        peakRanking: 2,
        serveEfficiency: 72.5,
        returnGamesWon: 37.5,
        breakPointConversion: 43.0,
        color: null,
        photoUrl: "photos/gauff.jpg"
      }
    },

    ensureInit(p) {
      if (this.initialized) return;

      // Assign colors (you can tweak these)
      const colorMap = {
        federer:   p.color(2, 131, 131),
        nadal:     p.color(44, 103, 230),
        djokovic:  p.color(255, 228, 96),
        alcaraz:   p.color(255, 152, 0),
        sinner:    p.color(255, 100, 100),
        serena:    p.color(102, 45, 145),
        henin:     p.color(0, 153, 153),
        swiatek:   p.color(46, 204, 113),
        sabalenka: p.color(231, 76, 60),
        gauff:     p.color(155, 89, 182)
      };

      for (let key in this.playerData) {
        this.playerData[key].color = colorMap[key] || p.color(120);
        p.loadImage(this.playerData[key].photoUrl, (img) => {
          this.playerPhotos[key] = img;
        });
      }

      // Default selection = first player in list
      this.selectedPlayer = this.playerOrder[0];

      this.initialized = true;
    },

    draw(p, manager, ai, progress) {
      this.ensureInit(p);
      p.background(240);

      this.drawTitle(p);
      this.drawPlayerList(p);
      this.drawPlayerDetail(p);
    },

    drawTitle(p) {
      p.push();
      p.fill(40);
      p.textSize(18);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      p.text("Player Dashboard: Explore Dominance by Player", p.width / 2, 25);

      p.textSize(11);
      p.fill(100);
      p.text(
        "Click a name on the left to see that player’s profile.",
        p.width / 2,
        45
      );
      p.pop();
    },

    // Left-hand column of names
    drawPlayerList(p) {
      const panelX = 20;
      const panelY = 80;
      const panelW = 200;
      const itemH = 32;
      const itemSpacing = 6;

      p.push();

      // Panel background
      p.noStroke();
      p.fill(250);
      p.rect(panelX - 5, panelY - 5, panelW + 10, p.height - panelY - 40, 6);

      this.playerOrder.forEach((key, index) => {
        const player = this.playerData[key];
        const y = panelY + index * (itemH + itemSpacing);
        const x = panelX;

        const isHover =
          p.mouseX > x &&
          p.mouseX < x + panelW &&
          p.mouseY > y &&
          p.mouseY < y + itemH;
        const isSelected = this.selectedPlayer === key;

        // Button background
        if (isSelected) {
          p.fill(player.color);
        } else if (isHover) {
          p.fill(220);
        } else {
          p.fill(235);
        }
        p.stroke(isSelected ? player.color : 210);
        p.strokeWeight(isSelected ? 2 : 1);
        p.rect(x, y, panelW, itemH, 4);

        // Text
        p.noStroke();
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(12);
        p.fill(isSelected ? 255 : 40);
        const label = `${player.name} (${player.tour})`;
        p.text(label, x + 10, y + itemH / 2);
      });

      p.pop();
    },

    // Right-hand detail view
    drawPlayerDetail(p) {
      const key = this.selectedPlayer;
      if (!key) return;

      const player = this.playerData[key];

      const detailX = 240;            // left edge of the detail area
      const detailY = 80;
      const detailW = p.width - detailX - 20;

      p.push();

      // Panel background
      p.noStroke();
      p.fill(255);
      p.rect(detailX - 5, detailY - 5, detailW + 10, p.height - detailY - 40, 6);

      // Photo
      const photoW = 180;
      const photoH = 220;
      const photoX = detailX + 20;
      const photoY = detailY + 10;

      if (this.playerPhotos[key]) {
        p.image(this.playerPhotos[key], photoX, photoY, photoW, photoH);
      } else {
        p.fill(230);
        p.rect(photoX, photoY, photoW, photoH, 4);
        p.fill(150);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text("Loading photo...", photoX + photoW / 2, photoY + photoH / 2);
      }

      // Name + summary stats to the right of the photo
      const textBlockX = photoX + photoW + 25;
      const textBlockY = photoY;

      p.fill(40);
      p.textAlign(p.LEFT, p.TOP);

      // Name
      p.textSize(18);
      p.text(player.name, textBlockX, textBlockY);

      // Tour + summary stats
      p.textSize(12);
      p.fill(90);
      const summaryY = textBlockY + 28;

      p.text(
        `Tour: ${player.tour}`,
        textBlockX,
        summaryY
      );
      p.text(
        `Grand Slam titles: ${player.grandSlamTitles}`,
        textBlockX,
        summaryY + 18
      );
      p.text(
        `Best year-end ranking: #${player.peakRanking}`,
        textBlockX,
        summaryY + 36
      );
      p.text(
        `Career win percentage: ${player.careerWinPct}%`,
        textBlockX,
        summaryY + 54
      );

      // Metrics bars
      const metrics = [
        { label: "Serve efficiency",  value: player.serveEfficiency,      max: 100, unit: "%" },
        { label: "Return games won",  value: player.returnGamesWon,       max: 50,  unit: "%" },
        { label: "Break point conv.", value: player.breakPointConversion, max: 60,  unit: "%" }
      ];

      const barsStartY = photoY + photoH + 20; // below the photo
      const barWidth = detailW - 60;
      const barHeight = 18;
      const barStartX = detailX + 30;

      p.textAlign(p.LEFT, p.CENTER);

      metrics.forEach((m, i) => {
        const y = barsStartY + i * 40;

        // Label
        p.fill(60);
        p.textSize(11);
        p.text(m.label, barStartX, y - 10);

        // Background
        p.fill(230);
        p.noStroke();
        p.rect(barStartX, y, barWidth, barHeight, 3);

        // Value fill
        const fillWidth = p.map(m.value, 0, m.max, 0, barWidth);
        p.fill(player.color);
        p.rect(barStartX, y, fillWidth, barHeight, 3);

        // Border
        p.noFill();
        p.stroke(200);
        p.rect(barStartX, y, barWidth, barHeight, 3);

        // Value text
        p.noStroke();
        p.fill(40);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(
          `${m.value.toFixed(1)}${m.unit}`,
          barStartX + barWidth,
          y + barHeight / 2
        );
        p.textAlign(p.LEFT, p.CENTER);
      });

      p.pop();
    },

    handleClick(p) {
      // Only need to check clicks on left-hand buttons
      const panelX = 20;
      const panelY = 80;
      const panelW = 200;
      const itemH = 32;
      const itemSpacing = 6;

      this.playerOrder.forEach((key, index) => {
        const x = panelX;
        const y = panelY + index * (itemH + itemSpacing);

        if (
          p.mouseX > x &&
          p.mouseX < x + panelW &&
          p.mouseY > y &&
          p.mouseY < y + itemH
        ) {
          this.selectedPlayer = key;
        }
      });

      return false;
    },

    // If later you want to load real CSV and override stats
    loadRealData(table) {
      console.log("Transform your CSV into playerData here");
    }
  };

  window.Viz_RQ2B_Dashboard = Viz;
})();
