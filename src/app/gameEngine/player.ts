import { Vector2 } from "./Vector2";
import { GameObject } from "./gameObject";
import * as vm from "node:vm";
import {delay} from "rxjs";
import {Bullet} from "./bullet";
import {GameEngineService} from "./game-engine.service";
import {Point} from "./point";
import {Color} from "./color";

export class Player extends GameObject {
  private readonly reloadTime: number = 0.2;
  constructor(game: GameEngineService, name: string) {
    super(game, name);
    this.color = new Color(220,151,54, 0.34); //"rgba(0,91,194,0.34)";
    this.image.src = '..\\..\\assets\\x.png';

  }

  private image = new Image();
  override draw(ctx: CanvasRenderingContext2D, scale: number, camera: Vector2, size: [number, number]) {
    const direction = this.game.mouse.plus(this.game.camera.minus(this.positon));
    const centerX: number = size[0]/2+(this.positon.x-camera.x)*scale;
    const centerY: number = size[1]/2-(this.positon.y-camera.y)*scale;
    const radius: number = this.size*scale;
    const width: number = this.size*0.7*scale;
    const length: number = (3*(Math.abs(this.reloadTime/2-this.delay)) + 1.2)*scale*this.size;
    const k: number = scale*this.size;
    const b: number = scale;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(3.14/2-Math.atan2(direction.y, direction.x));
    ctx.fillStyle = 'rgb(49,51,54)';
    ctx.strokeStyle = 'rgb(43,43,44)';
    ctx.lineWidth = scale*this.size/15;
    ctx.fillRect(-width / 2, -length, width, length);
    ctx.strokeRect(-width / 2, -length, width, length);
    ctx.restore();

    //super.draw(ctx, scale, camera, size);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = scale*this.size/15;
    ctx.strokeStyle = 'rgb(43,43,44)';
    ctx.fillStyle = this.color.toString();
    ctx.shadowBlur = 30;
    ctx.shadowColor =  'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 0;
    ctx.shadowColor =  'rgba(0, 0, 0, 0.0)';

      ctx.save();
      ctx.clip();

      const nw = this.size*2*scale;
      const nh = nw;
      ctx.drawImage(this.image, size[0]/2 -nw/2+ (this.positon.x-camera.x)*scale,  size[1]/2-(this.positon.y-camera.y)*scale-nh/2, nw, nh);
      ctx.restore();

    ctx.fill();
    ctx.stroke();
    ctx.closePath();



    const text = this.gameObjectName;
    const textHeight = (this.size/3*scale);
    ctx.font = "bold "+textHeight+"px Arial";
    ctx.fillStyle = "azure";
    ctx.strokeStyle = Color.stroke.toString();
    ctx.lineWidth = this.size*scale/20;
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;
    const textWidth = ctx.measureText(text).width;

    ctx.strokeText(text, centerX-textWidth/2, centerY+textHeight/4);
    ctx.fillText(text, centerX-textWidth/2, centerY+textHeight/4);
    this.drawHealthBar(ctx, centerX-3*b, centerY-1.5*k, 6*b, b, this.hp, this.maxHp, scale);
  }

  private delay = 0;
  shoot(delta: number){
    if(this.delay>0)
      return;
    let go = this.game.spawn(new Bullet(this));
    go.positon = this.positon.plus(this.game.mouse.plus(this.game.camera.minus(this.positon)).toUnit().times(this.size+2));
    go.velocity = this.game.mouse.plus(this.game.camera.minus(this.positon)).toUnit().times(25);
    this.velocity = this.velocity.minus(go.velocity.toUnit().times(2));
    if(go.velocity.x!=0&&go.velocity.y!=0){
      let rec = go.velocity.cross();
      rec = rec.times(Math.random()-0.5).times(15);
      go.velocity = go.velocity.plus(rec);
      go.color = new Color(this.color.r, this.color.g, this.color.b);
    }

    this.delay = this.reloadTime;
  }

  keyMap: { [key: string]: boolean } = {};

  override keyDown(key: string) {
    this.keyMap[key.toLowerCase()] = true;
  }

  override keyUp(key: string) {
    this.keyMap[key.toLowerCase()] = false;
  }

  isPressed(key: string) {
    return this.keyMap[key];
  }

  fixedUpdate(deltaTime: number){
    let a = 200/this.size;
    let vmax = 20.0;
    let vx = this.velocity.x;
    let vy = this.velocity.y;
    if (this.isPressed("w")) {
      vy += a*deltaTime;
    }
    if (this.isPressed("s")) {
      vy += -a*deltaTime;
    }
    if (this.isPressed("a")) {
      vx += -a*deltaTime;
    }
    if (this.isPressed("d")) {
      vx += a*deltaTime;
    }
    this.velocity = new Vector2(vx, vy);
    if(this.velocity.magnitude()>vmax)
      this.velocity = this.velocity.toUnit().times(vmax);
  }
  override update(deltaTime: number) {

    if(this.delay>0)
      this.delay-=deltaTime;
    if (this.isPressed("e")) {
      this.shoot(deltaTime);
    }


    for (const gameObject of this.game.gameObjects) {
      if(gameObject===this||!(gameObject instanceof Point)) continue;
      if (Vector2.distance(this.positon, gameObject.positon) < this.size&&this.size>gameObject.size) {
        //this.size += Math.sqrt(gameObject.size)/20;
        this.game.destroy(gameObject);
        this.attack(5);
        this.velocity = this.velocity.plus(this.positon.minus(gameObject.positon).toUnit().times(this.velocity.magnitude()/3));
      }
    }
  }
}
