export type WhiteboardTool = 'select' | 'pen' | 'rect' | 'circle' | 'line' | 'text' | 'eraser';

export interface BaseWhiteboardObject {
  id: string;
  stroke: string;
  strokeWidth: number;
  fill?: string;
}

export interface RectangleObject extends BaseWhiteboardObject {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleObject extends BaseWhiteboardObject {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface LineObject extends BaseWhiteboardObject {
  type: 'line';
  x: number;
  y: number;
  points: number[];
}

export interface TextObject extends BaseWhiteboardObject {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
}

export interface DrawingObject extends BaseWhiteboardObject {
  type: 'drawing';
  points: number[];
}

export type WhiteboardObject =
  | RectangleObject
  | CircleObject
  | LineObject
  | TextObject
  | DrawingObject;
