function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function bar(x,y,w,h,v,col,bg='rgba(23,8,4,.75)'){ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);ctx.fillStyle=col;ctx.fillRect(x,y,w*clamp(v,0,1),h)}
function txt(t,x,y,col,shadow='#170804'){ctx.fillStyle=shadow;ctx.fillText(t,x+1,y+1.5);ctx.fillStyle=col;ctx.fillText(t,x,y)}
