// viz_title.js
(function () {
    let courtImg = null;

    window.VizTitle = {
        draw: function (p, manager, ai, progress) {
            var cx = (manager.offsetX || 0) + (manager.width || 600) / 2;
            var cy = (manager.offsetY || 0) + (manager.height || 520) / 3;

            p.push();
            p.noStroke();

            if (ai === 0) {
                p.fill(255);
                var w = 420;
                var h = 120;
                p.rect(cx - w / 2, cy - h / 2, w, h, 6);

                // title
                p.fill(0);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(36);
                p.text(
                    'The Evolution of Dominance\nin Modern Tennis',
                    cx,
                    cy - 30 
                );

                p.textSize(18);
                p.text(
                    'Nikki Suneel, Selma Link, and Stephanie Liu',
                    cx,
                    cy + 45 
                );


            } else {
                if (!courtImg) {
                    courtImg = p.loadImage('photos/court_photo.jpg');
                }

                if (courtImg && courtImg.width) {
                    var canvasW = (manager.width || 600);
                    var imgMaxW = canvasW * 0.9;
                    var scale = imgMaxW / courtImg.width;
                    var imgW = courtImg.width * scale;
                    var imgH = courtImg.height * scale;

                    // position centered
                    var x = (manager.offsetX || 0) + canvasW / 2 - imgW / 2 - 80;
                    var y = cy - imgH / 2;

                    p.image(courtImg, x, y, imgW, imgH);
                }
            }

            p.pop();
        }
    };
})();
