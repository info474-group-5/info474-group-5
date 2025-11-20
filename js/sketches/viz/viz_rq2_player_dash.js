// // Big 3 vs Next Gen Player Comparison Dashboard
(function () {
  const Viz = {
    currentGeneration: "big3",
    selectedPlayer: null,
    playerPhotos: {},
    imagesLoaded: false,
    initialized: false,
    margin: { top: 60, right: 40, bottom: 60, left: 80 },
    
    // Dummy data structure - replace with real CSV data later
    playerData: {
      big3: {
        federer: {
          name: "Roger Federer",
          careerWinPct: 82.2,
          grandSlamTitles: 20,
          peakRanking: 1,
          serveEfficiency: 78.5,
          returnGamesWon: 34.2,
          breakPointConversion: 41.3,
          color: null,  // Will be set in ensureInit
          photoUrl: "photos/federer.jpg"
        },
        nadal: {
          name: "Rafael Nadal",
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
          careerWinPct: 83.5,
          grandSlamTitles: 24,
          peakRanking: 1,
          serveEfficiency: 76.2,
          returnGamesWon: 40.1,
          breakPointConversion: 45.2,
          color: null,
          photoUrl: "photos/djokovic.jpg"
        }
      },
      nextgen: {
        alcaraz: {
          name: "Carlos Alcaraz",
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
          careerWinPct: 74.5,
          grandSlamTitles: 2,
          peakRanking: 1,
          serveEfficiency: 77.1,
          returnGamesWon: 37.2,
          breakPointConversion: 42.5,
          color: null,
          photoUrl: "photos/sinner.jpg"
        }
      }
    },

    ensureInit(p) {
      if (this.initialized) return;
      
      // Set colors matching your other viz style
      this.playerData.big3.federer.color = p.color(2, 131, 131);
      this.playerData.big3.nadal.color = p.color(44, 103, 230);
      this.playerData.big3.djokovic.color = p.color(255, 228, 96);
      this.playerData.nextgen.alcaraz.color = p.color(255, 152, 0);
      this.playerData.nextgen.sinner.color = p.color(255, 100, 100);
      
      // Load player photos
      for (let gen in this.playerData) {
        for (let player in this.playerData[gen]) {
          p.loadImage(this.playerData[gen][player].photoUrl, (img) => {
            this.playerPhotos[player] = img;
          });
        }
      }
      
      this.initialized = true;
    },

    draw(p, manager, ai, progress) {
      this.ensureInit(p);
      
      p.background(240);  // Light gray background like your other viz
      
      // Draw all components
      this.drawTitle(p);
      this.drawToggleButton(p);
      this.drawPlayerCards(p);
      
      if (this.selectedPlayer) {
        this.drawMetricsComparison(p);
      } else {
        this.drawInstructions(p);
      }
    },

    drawTitle(p) {
      p.push();
      p.fill(40);
      p.textSize(18);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      p.text("Big 3 vs. Next Gen: Comparing Tennis Dominance", p.width / 2, 25);
      
      p.textSize(11);
      p.fill(100);
      p.text("Click a player card or toggle button to explore", p.width / 2, 45);
      p.pop();
    },

    drawToggleButton(p) {
      const toggleX = p.width / 2 - 80;
      const toggleY = 65;
      const toggleW = 160;
      const toggleH = 32;
      
      p.push();
      
      // Check if mouse is hovering
      const isHovering = p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
                        p.mouseY > toggleY && p.mouseY < toggleY + toggleH;
      
      // Toggle background - subtle colors
      if (this.currentGeneration === "big3") {
        p.fill(isHovering ? p.color(44, 103, 230) : p.color(70, 130, 240));
      } else {
        p.fill(isHovering ? p.color(255, 120, 0) : p.color(255, 152, 0));
      }
      p.noStroke();
      p.rect(toggleX, toggleY, toggleW, toggleH, 4);
      
      // Toggle labels
      p.fill(255);
      p.textSize(13);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.currentGeneration === "big3" ? "BIG 3" : "NEXT GEN", 
             toggleX + toggleW / 2, toggleY + toggleH / 2);
      
      p.pop();
    },

    drawPlayerCards(p) {
      const currentData = this.playerData[this.currentGeneration];
      const players = Object.keys(currentData);
      const cardWidth = 160;
      const cardHeight = 240;
      const spacing = 30;
      const totalWidth = cardWidth * players.length + spacing * (players.length - 1);
      const startX = (p.width - totalWidth) / 2;
      const startY = 120;
      
      p.push();
      
      players.forEach((playerKey, index) => {
        const player = currentData[playerKey];
        const x = startX + (cardWidth + spacing) * index;
        const y = startY;
        
        // Check if hovering
        const isHovering = p.mouseX > x && p.mouseX < x + cardWidth &&
                          p.mouseY > y && p.mouseY < y + cardHeight;
        const isSelected = this.selectedPlayer === playerKey;
        
        // Card background - clean white cards
        p.fill(255);
        p.stroke(isSelected ? player.color : (isHovering ? 150 : 200));
        p.strokeWeight(isSelected ? 3 : 1);
        p.rect(x, y, cardWidth, cardHeight, 4);
        
        // Player photo
        if (this.playerPhotos[playerKey]) {
          p.image(this.playerPhotos[playerKey], x + 10, y + 10, 140, 140);
        } else {
          // Placeholder if image not loaded
          p.fill(230);
          p.noStroke();
          p.rect(x + 10, y + 10, 140, 140, 2);
          p.fill(150);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(10);
          p.text("Loading...", x + 80, y + 80);
        }
        
        // Color indicator bar
        p.noStroke();
        p.fill(player.color);
        p.rect(x + 10, y + 155, 140, 3);
        
        // Player name
        p.fill(40);
        p.textSize(14);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(player.name, x + cardWidth / 2, y + 172);
        
        // Key stats - compact layout
        p.textSize(10);
        p.fill(80);
        p.textAlign(p.LEFT, p.CENTER);
        p.text("Slams:", x + 15, y + 195);
        p.text("Win %:", x + 15, y + 210);
        p.text("Peak:", x + 15, y + 225);
        
        p.textAlign(p.RIGHT, p.CENTER);
        p.fill(40);
        p.text(player.grandSlamTitles, x + cardWidth - 15, y + 195);
        p.text(`${player.careerWinPct}%`, x + cardWidth - 15, y + 210);
        p.text(`#${player.peakRanking}`, x + cardWidth - 15, y + 225);
      });
      
      p.pop();
    },

    drawMetricsComparison(p) {
      const currentData = this.playerData[this.currentGeneration];
      const player = currentData[this.selectedPlayer];
      
      const metricsY = 390;
      const metrics = [
        { label: "Career Win %", value: player.careerWinPct, max: 100, unit: "%" },
        { label: "Serve Efficiency", value: player.serveEfficiency, max: 100, unit: "%" },
        { label: "Return Games Won", value: player.returnGamesWon, max: 50, unit: "%" },
        { label: "Break Point Conv.", value: player.breakPointConversion, max: 60, unit: "%" }
      ];
      
      p.push();
      
      // Section title
      p.fill(40);
      p.textSize(15);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      p.text(`${player.name} — Detailed Statistics`, p.width / 2, metricsY - 15);
      
      // Draw bar charts for each metric - horizontal layout like scatter plot
      const barWidth = 280;
      const barHeight = 20;
      const startX = p.width / 2 - 140;
      const startY = metricsY + 15;
      
      metrics.forEach((metric, index) => {
        const y = startY + index * 45;
        
        // Label
        p.fill(60);
        p.textSize(11);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(metric.label, startX - 150, y + barHeight / 2);
        
        // Bar background - light gray
        p.fill(220);
        p.noStroke();
        p.rect(startX, y, barWidth, barHeight, 3);
        
        // Bar fill - use player color
        p.fill(player.color);
        const fillWidth = p.map(metric.value, 0, metric.max, 0, barWidth);
        p.rect(startX, y, fillWidth, barHeight, 3);
        
        // Border around bar
        p.noFill();
        p.stroke(180);
        p.strokeWeight(1);
        p.rect(startX, y, barWidth, barHeight, 3);
        
        // Value text
        p.fill(40);
        p.noStroke();
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(11);
        p.text(`${metric.value.toFixed(1)}${metric.unit}`, startX + barWidth + 45, y + barHeight / 2);
      });
      
      p.pop();
    },

    drawInstructions(p) {
      p.push();
      p.fill(120);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      p.text("← Click a player card to view detailed metrics", p.width / 2, 470);
      p.pop();
    },

    handleClick(p) {
      // Check toggle button click
      const toggleX = p.width / 2 - 80;
      const toggleY = 65;
      const toggleW = 160;
      const toggleH = 32;
      
      if (p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
          p.mouseY > toggleY && p.mouseY < toggleY + toggleH) {
        this.currentGeneration = this.currentGeneration === "big3" ? "nextgen" : "big3";
        this.selectedPlayer = null;
        return true;
      }
      
      // Check player card clicks
      const currentData = this.playerData[this.currentGeneration];
      const players = Object.keys(currentData);
      const cardWidth = 160;
      const cardHeight = 240;
      const spacing = 30;
      const totalWidth = cardWidth * players.length + spacing * (players.length - 1);
      const startX = (p.width - totalWidth) / 2;
      const startY = 120;
      
      players.forEach((playerKey, index) => {
        const x = startX + (cardWidth + spacing) * index;
        const y = startY;
        
        if (p.mouseX > x && p.mouseX < x + cardWidth &&
            p.mouseY > y && p.mouseY < y + cardHeight) {
          this.selectedPlayer = playerKey;
        }
      });
      
      return false;
    },

    // Method to load real data from CSV when ready
    loadRealData(table) {
      // TODO: Process your CSV data here
      // Transform it into the playerData structure
      console.log("Load your real tennis data here from CSV");
    }
  };

  window.Viz_RQ2B_Dashboard = Viz;
})();