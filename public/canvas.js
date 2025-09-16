let isDrawing = false;
var canvas = null;
var context = null;


onload = function() {
  draw();
};

function draw() {
   canvas = document.getElementById('image');
   context = canvas.getContext('2d');
  if ( ! canvas || ! canvas.getContext ) {
    return false;
  }
  
context.fillStyle = 'rgb(255,255,255)';
   context.fillRect(0, 0, 640, 480);
   context.fillStyle = 'black';
   context.strokeRect(0,0, 640, 480);
  
  canvas.addEventListener('mousedown', function(event){
    isDrawing = true;
  });

  canvas.addEventListener('mousemove', function(event){
    if(!isDrawing) return;



 // Canvasの位置を取得
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;


    

    // 円を描画
    context.beginPath();
    context.arc(x, y, 10, 0, Math.PI * 2);
    context.fillStyle = 'black';
    context.fill();
    context.closePath();
});

window.addEventListener('mouseup', function(event) {
    isDrawing = false;
});
}

function save(){
 canvas = document.getElementById("image");
 const a = document.createElement("a");
a.href = canvas.toDataURL("image/jpeg", 0.75); // PNGなら"image/png"
a.download = "image.jpg";
a.click();
 
}

function clearStamp(){
  canvas = document.getElementById('image');
   context = canvas.getContext('2d');
   context.fillStyle = 'rgb(255,255,255)';
   context.fillRect(0, 0, 640, 480);
   context.fillStyle = 'black';
   context.strokeRect(0,0, 640, 480);

}