// viz_title.js
// Draw title-style screens for early active indexes (0 and 1)
(function () {
    // cache the image so we don't reload it every frame
    let courtImg = null;

    window.VizTitle = {
        draw: function (p, manager, ai, progress) {
            var cx = (manager.offsetX || 0) + (manager.width || 600) / 2;
            var cy = (manager.offsetY || 0) + (manager.height || 520) / 3;

            p.push();
            p.noStroke();

            if (ai === 0) {
                // ----- SCREEN 0: KEEP EXISTING INFO 474 TITLE -----
                p.fill(255);
                var w = 420;
                var h = 120;
                p.rect(cx - w / 2, cy - h / 2, w, h, 6);

                // --- TITLE ---
                p.fill(0);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(36);
                p.text(
                    'The Evolution of Dominance\nin Modern Tennis',
                    cx,
                    cy - 20              // move title slightly higher
                );

                // --- NAMES (More Padding) ---
                p.textSize(18);
                p.text(
                    'Nikki Suneel, Selma Link, and Stephanie Liu',
                    cx,
                    cy + 35              // adds clean spacing under the title
                );


            } else {
                // ----- SCREEN 1: SHOW IMAGE INSTEAD OF "Final Project" -----
                if (!courtImg) {
                    courtImg = p.loadImage('photos/court_photo.jpg');
                }

                if (courtImg && courtImg.width) {
                    // scale image to fit nicely in the card area
                    var canvasW = (manager.width || 600);
                    var imgMaxW = canvasW * 0.9;      // max 60% of width
                    var scale = imgMaxW / courtImg.width;
                    var imgW = courtImg.width * scale;
                    var imgH = courtImg.height * scale;

                    // position roughly centered (you can tweak these)
                    var x = (manager.offsetX || 0) + canvasW / 2 - imgW / 2 - 80;
                    var y = cy - imgH / 2;

                    p.image(courtImg, x, y, imgW, imgH);
                }
            }

            p.pop();
        }
    };
})();
