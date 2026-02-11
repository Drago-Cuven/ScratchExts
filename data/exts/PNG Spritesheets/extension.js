// Name: PNG Spritesheets
// ID: DragoPngSpritesheets
// Description:  Create and Export PNG Spritesheets
// By Drago Cuven <https://github.com/Drago-Cuven>

(function(Scratch) {
  'use strict';
  const { Cast, BlockType, BlockShape, ArgumentType, vm, translate, runtime } = Scratch;

  const menuIconURI = "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI4MC45Mjc2NCIgaGVpZ2h0PSI4MC45Mjc2NCIgdmlld0JveD0iMCwwLDgwLjkyNzY0LDgwLjkyNzY0Ij48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTk5LjUzNjE4LC0xMzkuNTM2MTgpIj48ZyBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiPjxwYXRoIGQ9Ik0xOTkuNTM2MTgsMTgwYzAsLTIyLjM0NzU1IDE4LjExNjI3LC00MC40NjM4MiA0MC40NjM4MiwtNDAuNDYzODJjMjIuMzQ3NTUsMCA0MC40NjM4MiwxOC4xMTYyNyA0MC40NjM4Miw0MC40NjM4MmMwLDIyLjM0NzU1IC0xOC4xMTYyNyw0MC40NjM4MiAtNDAuNDYzODIsNDAuNDYzODJjLTIyLjM0NzU1LDAgLTQwLjQ2MzgyLC0xOC4xMTYyNyAtNDAuNDYzODIsLTQwLjQ2MzgyeiIgZmlsbC1vcGFjaXR5PSIwLjUwMTk2IiBmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNMjAzLjc5OTU5LDE4MGMwLC0xOS45OTI5MyAxNi4yMDc0OCwtMzYuMjAwNDEgMzYuMjAwNDEsLTM2LjIwMDQxYzE5Ljk5MjkzLDAgMzYuMjAwNDEsMTYuMjA3NDggMzYuMjAwNDEsMzYuMjAwNDFjMCwxOS45OTI5MyAtMTYuMjA3NDgsMzYuMjAwNDEgLTM2LjIwMDQxLDM2LjIwMDQxYy0xOS45OTI5MywwIC0zNi4yMDA0MSwtMTYuMjA3NDggLTM2LjIwMDQxLC0zNi4yMDA0MXoiIGZpbGw9IiMyOTM5Y2MiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBzdHJva2UtbGluZWNhcD0iYnV0dCIvPjxwYXRoIGQ9Ik0yMDguMjc5MjUsMTc5Ljk5OTk4YzAsLTE3LjU1NzkgMTQuMjMzNDksLTMxLjc5MTM5IDMxLjc5MTM5LC0zMS43OTEzOWMxNy41NTc5LDAgMzEuNzkxMzksMTQuMjMzNDkgMzEuNzkxMzksMzEuNzkxMzljMCwxNy41NTc5IC0xNC4yMzM0OSwzMS43OTEzOSAtMzEuNzkxMzksMzEuNzkxMzljLTE3LjU1NzksMCAtMzEuNzkxMzksLTE0LjIzMzQ5IC0zMS43OTEzOSwtMzEuNzkxMzl6IiBmaWxsPSIjMzM0N2ZmIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNMjQyLjMwMzQzLDE3Ny45OTIxNnYtMy40NTUxIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMjQyLjMwMzQzLDE2OS45ODQzOXYtMy40NTUxIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMjQyLjMwMzQzLDE1OC41MjE1M3YzLjQ1NTEiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yNDIuMzEwOSwxNzcuOTk5NjJoMy40NTUxIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMjUwLjMxODY1LDE3Ny45OTk2MmgzLjQ1NTEiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yNTguMzI2NDIsMTc3Ljk5OTYyaDMuNDU1MSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTIzMy43MzEwNCwxODQuMjY0MjdjMCwwIC0xLjU1NzU4LC0xOC4yMjUxNyAtMC45MzI1MywtMjEuNTg2NzZjMC42MjUwNSwtMy4zNjE2IDYuMTEzMjgsLTYuMjc2MDEgNi4xMTMyOCwtNi4yNzYwMXYyNy44NjI3NnoiIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIwIiBzdHJva2UtbGluZWNhcD0iYnV0dCIvPjxwYXRoIGQ9Ik0yMzUuODM3ODIsMTgxLjUwMTEyaDI3Ljg2Mjc2YzAsMCAtMi45MTQ0Miw1LjQ4ODIzIC02LjI3NjAxLDYuMTEzMjhjLTMuMzYxNiwwLjYyNTA2IC0yMS41ODY3NiwtMC45MzI1MyAtMjEuNTg2NzYsLTAuOTMyNTN6IiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMCIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNMjM1LjQ0OTI2LDE4OC42NTI3NGMtMi4yODg5OSwwIC00LjE0NDU5LC0xLjg1NTU5IC00LjE0NDU5LC00LjE0NDU5YzAsLTIuMjg4OTkgMS44NTU1OSwtNC4xNDQ1OSA0LjE0NDU5LC00LjE0NDU5YzIuMjg4OTksMCA0LjE0NDU5LDEuODU1NTkgNC4xNDQ1OSw0LjE0NDU5YzAsMi4yODg5OSAtMS44NTU1OSw0LjE0NDU5IC00LjE0NDU5LDQuMTQ0NTl6IiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNMjI2LjAzODM5LDE3Ny4yMDM4N2M1LjM3ODczLDAgOS43MzkwNSwyLjY5MDM2IDkuNzM5MDUsNi4wMDkwOWMwLDMuMzE4NzMgLTQuMzYwMzMsNi4wMDkwOSAtOS43MzkwNSw2LjAwOTA5Yy01LjM3ODczLDAgLTkuNzM5MDQsLTIuNjkwMzYgLTkuNzM5MDQsLTYuMDA5MDljMCwtMy4zMTg3MyA0LjM2MDMyLC02LjAwOTA5IDkuNzM5MDQsLTYuMDA5MDl6TTIxOS44MjIyNSwxODMuMjEyOTZjMCwxLjg5MzU2IDIuNzgzMDYsMy40Mjg1OCA2LjIxNjE0LDMuNDI4NThjMy40MzMwOCwwIDYuMjE2MTQsLTEuNTM1MDIgNi4yMTYxNCwtMy40Mjg1OGMwLC0xLjg5MzU2IC0yLjc4MzA2LC0zLjQyODU5IC02LjIxNjE0LC0zLjQyODU5Yy0zLjQzMzA4LDAgLTYuMjE2MTQsMS41MzUwMyAtNi4yMTYxNCwzLjQyODU5eiIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIHN0cm9rZS1saW5lY2FwPSJidXR0Ii8+PHBhdGggZD0iTTI0Mi4zNjQ5NywxOTMuODU5NGMwLDUuMzc4NzMgLTIuNjkwMzYsOS43MzkwNSAtNi4wMDkwOSw5LjczOTA1Yy0zLjMxODczLDAgLTYuMDA5MDksLTQuMzYwMzMgLTYuMDA5MDksLTkuNzM5MDVjMCwtNS4zNzg3MyAyLjY5MDM2LC05LjczOTA1IDYuMDA5MDksLTkuNzM5MDVjMy4zMTg3MywwIDYuMDA5MDksNC4zNjAzMyA2LjAwOTA5LDkuNzM5MDV6TTIzNi4zNTU4OCwxODcuNjQzMjZjLTEuODkzNTYsMCAtMy40Mjg1OCwyLjc4MzA2IC0zLjQyODU4LDYuMjE2MTRjMCwzLjQzMzA4IDEuNTM1MDIsNi4yMTYxNCAzLjQyODU4LDYuMjE2MTRjMS44OTM1NSwwIDMuNDI4NTgsLTIuNzgzMDYgMy40Mjg1OCwtNi4yMTYxNGMwLC0zLjQzMzA4IC0xLjUzNTAyLC02LjIxNjE0IC0zLjQyODU4LC02LjIxNjE0eiIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIHN0cm9rZS1saW5lY2FwPSJidXR0Ii8+PC9nPjwvZz48L3N2Zz48IS0tcm90YXRpb25DZW50ZXI6NDAuNDYzODIwMDAwMDAwMDM6NDAuNDYzODItLT4=";

  const ext = {
    id: 'DragoPNGSpritesheets',
    name: 'PNG Spritesheets',
    colors: ['#3347ff', '#296acc', '#1f5099']
  };

  class PNGSHEETSEXT {
    constructor() {
      this.foldersState = {
        sheetUtilities: false,
        simpleSheets: false,
        preciseSheets: false
      };
      
      this.focusItems = {
        png: '',
        xml: '',
        json: '',
        ini: '',
        txt: ''
      };
      
      this.sheetDatabase = {
        png: null,
        xml: null,
        padding: 0,
        animations: {},
        frameOffsets: {}
      };
      
      this.focusSheet = {
        dataurl: '',
        json: {
          cellCountX: 1,
          cellCountY: 1,
          cellWidth: 0,
          cellHeight: 0
        },
        cellContents: {},
        pendingFrames: {}
      };
      
      this.jsonCuttingData = {
        dataurl: '',
        json: '',
        frames: []
      };
      
      this.simpleSheet = {
        animations: {},
        blankFrames: {},
        finalImage: '',
        config: {
          resize: 'off',
          orientation: 'horizontal',
          padding: 6,
          dupeMissingFrames: 'off'
        }
      };
      
      this.checked = true;
    }

    reloadBlocks() {
        vm.extensionManager.refreshBlocks('DragoPNGSpritesheets');
    }

    getInfo() {
      return {
        id: ext.id,
        name: translate(ext.name),
        menuIconURI,
        color1: ext.colors[0],
        color2: ext.colors[1],
        color3: ext.colors[2],
        blocks: [
          {
            opcode: 'toggleSheetUtilities',
            blockType: BlockType.BUTTON,
            text: this.foldersState.sheetUtilities ? translate('📂 Sheet Utilities') : translate('📁 Sheet Utilities'),
            func: 'toggleSheetUtilities'
          },
          {
            blockType: BlockType.LABEL,
            text: translate('Sheet Utilities'),
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'getFocusItem',
            blockType: BlockType.REPORTER,
            text: translate('get focus [filetype]'),
            arguments: {
              filetype: {
                type: ArgumentType.STRING,
                menu: 'fileTypeMenu'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'getAnimationsCount',
            blockType: BlockType.REPORTER,
            text: translate('animations count in sheet data [sheetData] with format [format]'),
            arguments: {
              sheetData: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'getFormat'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'getAnimationFramesCount',
            blockType: BlockType.REPORTER,
            text: translate('frames count of animation: [animation] in sheet data [sheetData] with format [format]'),
            arguments: {
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'Animation'
              },
              sheetData: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'getFormat'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'getTotalFramesCount',
            blockType: BlockType.REPORTER,
            text: translate('total frames count in sheet data [sheetData] with format [format]'),
            arguments: {
              sheetData: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'getFormat'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'getAnimationsList',
            blockType: BlockType.REPORTER,
            text: translate('animations list in sheet data [sheetData] with format [format]'),
            arguments: {
              sheetData: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'getFormat'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'getAnimationFramesList',
            blockType: BlockType.REPORTER,
            text: translate('frames list of animation: [animation] in sheet data [sheetData] with format [format]'),
            arguments: {
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'Animation'
              },
              sheetData: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'getFormat'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'getAllFramesList',
            blockType: BlockType.REPORTER,
            text: translate('all frames in sheet data [sheetData] with format [format]'),
            arguments: {
              sheetData: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'getFormat'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'getFrameCoordinates',
            blockType: BlockType.REPORTER,
            text: translate('coordinates of frame: [frame] animation: [animation] in sheet data [sheetData] with format [format]'),
            arguments: {
              frame: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'Animation'
              },
              sheetData: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'getFormat'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'getFrameFromAnimation',
            blockType: BlockType.REPORTER,
            text: translate('get frame: [frame] of animation: [animation] using format: [format] data: [input] from image [dataurl]'),
            arguments: {
              frame: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'Animation'
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'useFormat'
              },
              input: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              dataurl: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'flipImage',
            blockType: BlockType.REPORTER,
            text: translate('flip image: [image] horizontally: [flipX] vertically: [flipY]'),
            arguments: {
              image: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              flipX: {
                type: ArgumentType.BOOLEAN,
                defaultValue: true
              },
              flipY: {
                type: ArgumentType.BOOLEAN,
                defaultValue: false
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'convertFormat',
            blockType: BlockType.REPORTER,
            text: translate('convert [fromFormat] to [toFormat] using data [data]'),
            arguments: {
              fromFormat: {
                type: ArgumentType.STRING,
                menu: 'useFormat'
              },
              toFormat: {
                type: ArgumentType.STRING,
                menu: 'useFormat'
              },
              data: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'checkAnimationExists',
            blockType: BlockType.BOOLEAN,
            text: translate('animation: [animation] exists in sheet data [sheetData] with format [format]'),
            arguments: {
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'Animation'
              },
              sheetData: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'getFormat'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'checkFrameExists',
            blockType: BlockType.BOOLEAN,
            text: translate('frame: [frame] of animation: [animation] exists in sheet data [sheetData] with format [format]'),
            arguments: {
              frame: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'Animation'
              },
              sheetData: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'getFormat'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'setFocusItem',
            blockType: BlockType.COMMAND,
            text: translate('set focus [filetype] to [content]'),
            arguments: {
              filetype: {
                type: ArgumentType.STRING,
                menu: 'fileTypeMenu'
              },
              content: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'clearFocusItem',
            blockType: BlockType.COMMAND,
            text: translate('clear focus [filetype]'),
            arguments: {
              filetype: {
                type: ArgumentType.STRING,
                menu: 'clearFileTypeMenu'
              }
            },
            hideFromPalette: !this.foldersState.sheetUtilities
          },
          {
            opcode: 'toggleSimpleSheets',
            blockType: BlockType.BUTTON,
            text: this.foldersState.simpleSheets ? translate('📂 Simple Sheets') : translate('📁 Simple Sheets'),
            func: 'toggleSimpleSheets'
          },
          {
            blockType: BlockType.LABEL,
            text: translate('Simple Sheets'),
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'clearSimpleSheet',
            blockType: BlockType.COMMAND,
            text: translate('clear simple sheet'),
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'setSimpleSheet',
            blockType: BlockType.COMMAND,
            text: translate('set simple sheet [filetype] to [content]'),
            arguments: {
              filetype: {
                type: ArgumentType.STRING,
                menu: 'fileTypeMenu'
              },
              content: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'getSimpleSheet',
            blockType: BlockType.REPORTER,
            text: translate('get simple sheet [filetype]'),
            arguments: {
              filetype: {
                type: ArgumentType.STRING,
                menu: 'fileTypeMenu'
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'setSimpleSheetFrame',
            blockType: BlockType.COMMAND,
            text: translate('set frame [number] of animation [animation] to [dataurl] in simple sheet'),
            arguments: {
              number: {
                type: ArgumentType.NUMBER,
                defaultValue: -1
              },
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              },
              dataurl: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'removeSimpleSheetFrame',
            blockType: BlockType.COMMAND,
            text: translate('remove frame [number] of animation [animation] in simple sheet'),
            arguments: {
              number: {
                type: ArgumentType.NUMBER,
                defaultValue: -1
              },
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'removeSimpleSheetAnimation',
            blockType: BlockType.COMMAND,
            text: translate('remove animation [animation] from simple sheet'),
            arguments: {
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'getSimpleSheetAnimations',
            blockType: BlockType.REPORTER,
            text: translate('animations in simple sheet'),
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'removeSimpleSheetAnimationByNumber',
            blockType: BlockType.COMMAND,
            text: translate('remove animation number [number] from simple sheet'),
            arguments: {
              number: {
                type: ArgumentType.NUMBER,
                defaultValue: 0
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'isSimpleSheetFrame',
            blockType: BlockType.BOOLEAN,
            text: translate('is frame [number] of animation [animation] in simple sheet [type]'),
            arguments: {
              number: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              },
              type: {
                type: ArgumentType.STRING,
                menu: 'frameTypeMenu'
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'setSimpleSheetResize',
            blockType: BlockType.COMMAND,
            text: translate('simple sheet config: resize [resize] to match'),
            arguments: {
              resize: {
                type: ArgumentType.STRING,
                menu: 'resizeMenu',
                defaultValue: 'off'
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'setSimpleSheetOrientation',
            blockType: BlockType.COMMAND,
            text: translate('simple sheet config: generation orientation [orientation]'),
            arguments: {
              orientation: {
                type: ArgumentType.STRING,
                menu: 'orientationMenu',
                defaultValue: 'horizontal'
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'setSimpleSheetPadding',
            blockType: BlockType.COMMAND,
            text: translate('simple sheet config: padding: [padding]'),
            arguments: {
              padding: {
                type: ArgumentType.NUMBER,
                defaultValue: 6
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'setSimpleSheetDupeMissing',
            blockType: BlockType.COMMAND,
            text: translate('simple sheet config: dupe missing frames: [dupe]'),
            arguments: {
              dupe: {
                type: ArgumentType.STRING,
                menu: 'dupeMenu',
                defaultValue: 'off'
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'getSimpleSheetFrame',
            blockType: BlockType.REPORTER,
            text: translate('get frame [number] of animation [anim] in simplesheet'),
            arguments: {
              number: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              anim: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'getSimpleSheetFrameFromData',
            blockType: BlockType.REPORTER,
            text: translate('get frame [number] of animation [anim] in simple spritesheet [spritesheet dataurl] using [format] data [data]'),
            arguments: {
              number: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              anim: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              },
              dataurl: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'useFormat'
              },
              data: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'getAnimationVariable',
            blockType: BlockType.REPORTER,
            text: translate('get variable [variable] of animation [animation]'),
            arguments: {
              variable: {
                type: ArgumentType.STRING,
                defaultValue: 'fps'
              },
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'setAnimationVariable',
            blockType: BlockType.COMMAND,
            text: translate('set variable [variable] of animation [animation] to [value]'),
            arguments: {
              variable: {
                type: ArgumentType.STRING,
                defaultValue: 'fps'
              },
              animation: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              },
              value: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.simpleSheets
          },
          {
            opcode: 'togglePreciseSheets',
            blockType: BlockType.BUTTON,
            text: this.foldersState.preciseSheets ? translate('📂 Precise Sheets') : translate('📁 Precise Sheets'),
            func: 'togglePreciseSheets'
          },
          {
            blockType: BlockType.LABEL,
            text: translate('Precise Sheets'),
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'getPreciseSheetAsset',
            blockType: BlockType.REPORTER,
            text: translate('precise sheet asset: [asset]'),
            arguments: {
              asset: {
                type: ArgumentType.STRING,
                menu: 'preciseAssetMenu'
              }
            },
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'getCellImage',
            blockType: BlockType.REPORTER,
            text: translate('get cell column: [x] row: [y]'),
            arguments: {
              x: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              y: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              }
            },
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'getExternalCell',
            blockType: BlockType.REPORTER,
            text: translate('get cell column: [x] row: [y] from image: [image] using [format] data [data]'),
            arguments: {
              x: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              y: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              image: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'useFormat'
              },
              data: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'getGridCuttingJSON',
            blockType: BlockType.REPORTER,
            text: translate('grid cutting json columns: [x] rows: [y]'),
            arguments: {
              x: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              y: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              }
            },
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'generateExternalSheet',
            blockType: BlockType.REPORTER,
            text: translate('generate sheet from image: [image] using [format] data [data]'),
            arguments: {
              image: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'useFormat'
              },
              data: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'getCellDimensions',
            blockType: BlockType.REPORTER,
            text: translate('get cell dimensions'),
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'getSheetJSON',
            blockType: BlockType.REPORTER,
            text: translate('get sheet json'),
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'setPreciseSheet',
            blockType: BlockType.COMMAND,
            text: translate('set precise sheet image: [image] with [format] data [data]'),
            arguments: {
              image: {
                type: ArgumentType.STRING,
                defaultValue: ''
              },
              format: {
                type: ArgumentType.STRING,
                menu: 'useFormat'
              },
              data: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'createNewSheet',
            blockType: BlockType.COMMAND,
            text: translate('create new sheet'),
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'generatePreciseSheet',
            blockType: BlockType.COMMAND,
            text: translate('generate precise sheet'),
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'setCellImage',
            blockType: BlockType.COMMAND,
            text: translate('set cell column: [x] row: [y] to image: [image]'),
            arguments: {
              x: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              y: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              image: {
                type: ArgumentType.STRING,
                defaultValue: ''
              }
            },
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'removeCell',
            blockType: BlockType.COMMAND,
            text: translate('remove cell column: [x] row: [y]'),
            arguments: {
              x: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              y: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              }
            },
            hideFromPalette: !this.foldersState.preciseSheets
          },
          {
            opcode: 'resizeCells',
            blockType: BlockType.COMMAND,
            text: translate('resize cells to width: [width] height: [height]'),
            arguments: {
              width: {
                type: ArgumentType.NUMBER,
                defaultValue: 100
              },
              height: {
                type: ArgumentType.NUMBER,
                defaultValue: 100
              }
            },
            hideFromPalette: !this.foldersState.preciseSheets
          }
        ],
        menus: {
          fileTypeMenu: {
            acceptReporters: true,
            items: [
              { text: translate('png'), value: 'png' },
              { text: translate('xml'), value: 'xml' },
              { text: translate('json'), value: 'json' },
              { text: translate('ini'), value: 'ini' },
              { text: translate('txt'), value: 'txt' }
            ]
          },
          clearFileTypeMenu: {
            acceptReporters: true,
            items: [
              { text: translate('all'), value: 'all' },
              { text: translate('png'), value: 'png' },
              { text: translate('xml'), value: 'xml' },
              { text: translate('json'), value: 'json' },
              { text: translate('ini'), value: 'ini' },
              { text: translate('txt'), value: 'txt' }
            ]
          },
          useFormat: {
            acceptReporters: true,
            items: [
              { text: translate('xml'), value: 'xml' },
              { text: translate('json'), value: 'json' },
              { text: translate('ini'), value: 'ini' },
              { text: translate('txt'), value: 'txt' }
            ]
          },
          getFormat: {
            acceptReporters: true,
            items: [
              { text: translate('detect'), value: 'detect' },
              { text: translate('xml'), value: 'xml' },
              { text: translate('json'), value: 'json' },
              { text: translate('ini'), value: 'ini' },
              { text: translate('txt'), value: 'txt' }
            ]
          },
          preciseAssetMenu: {
            acceptReporters: true,
            items: [
              { text: translate('image'), value: 'dataurl' },
              { text: translate('json'), value: 'json' }
            ]
          },
          resizeMenu: {
            acceptReporters: true,
            items: [
              { text: translate('off'), value: 'off' },
              { text: translate('up'), value: 'up' },
              { text: translate('down'), value: 'down' }
            ]
          },
          orientationMenu: {
            acceptReporters: true,
            items: [
              { text: translate('horizontal'), value: 'horizontal' },
              { text: translate('vertical'), value: 'vertical' }
            ]
          },
          dupeMenu: {
            acceptReporters: true,
            items: [
              { text: translate('off'), value: 'off' },
              { text: translate('behind'), value: 'behind' },
              { text: translate('forward'), value: 'forward' }
            ]
          },
          frameTypeMenu: {
            acceptReporters: true,
            items: [
              { text: translate('nonexistent'), value: 'nonexistent' },
              { text: translate('blank'), value: 'blank' }
            ]
          }
        }
      };
    }

    toggleSheetUtilities() {
      this.foldersState.sheetUtilities = !this.foldersState.sheetUtilities;
      this.reloadBlocks();
    }

    toggleSimpleSheets() {
      this.foldersState.simpleSheets = !this.foldersState.simpleSheets;
      this.reloadBlocks();
    }

    togglePreciseSheets() {
      this.foldersState.preciseSheets = !this.foldersState.preciseSheets;
      this.reloadBlocks();
    }

    setFocusItem(args) {
      const filetype = args.filetype;
      const content = args.content;
      if (this.focusItems.hasOwnProperty(filetype)) {
        this.focusItems[filetype] = content;
      }
    }

    clearFocusItem(args) {
      const filetype = args.filetype;
      if (filetype === 'all') {
        this.focusItems.png = '';
        this.focusItems.xml = '';
        this.focusItems.json = '';
        this.focusItems.ini = '';
        this.focusItems.txt = '';
      } else if (this.focusItems.hasOwnProperty(filetype)) {
        this.focusItems[filetype] = '';
      }
    }

    getFocusItem(args) {
      const filetype = args.filetype;
      return this.focusItems[filetype] || '';
    }

    detectFormat(data) {
      if (!data || typeof data !== 'string') return 'xml';
      const trimmed = data.trim();
      if (trimmed.startsWith('<?xml') || trimmed.startsWith('<TextureAtlas')) return 'xml';
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) return 'json';
      if (trimmed.includes('=') && (trimmed.includes('\n[') || trimmed.startsWith('['))) return 'ini';
      if (trimmed.includes('anim:')) return 'txt';
      return 'xml';
    }

    parseSheetData(data, format) {
      if (format === 'detect') format = this.detectFormat(data);
      if (!data) return { animations: {}, frames: [] };

      if (format === 'xml') {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'text/xml');
        const subTextures = xmlDoc.getElementsByTagName('SubTexture');
        const animations = {};
        const frames = [];

        for (let i = 0; i < subTextures.length; i++) {
          const subTexture = subTextures[i];
          const name = subTexture.getAttribute('name');
          if (!name) continue;
          
          let animationName = name;
          let frameNum = 0;
          
          const match = name.match(/^(.*?)(\d{4})$/);
          if (match) {
            animationName = match[1];
            frameNum = parseInt(match[2], 10);
          }

          if (!animations[animationName]) animations[animationName] = [];
          const frameData = {
            name: name,
            x: parseInt(subTexture.getAttribute('x')),
            y: parseInt(subTexture.getAttribute('y')),
            width: parseInt(subTexture.getAttribute('width')),
            height: parseInt(subTexture.getAttribute('height')),
            frameX: parseInt(subTexture.getAttribute('frameX') || '0'),
            frameY: parseInt(subTexture.getAttribute('frameY') || '0'),
            frameWidth: parseInt(subTexture.getAttribute('frameWidth') || subTexture.getAttribute('width')),
            frameHeight: parseInt(subTexture.getAttribute('frameHeight') || subTexture.getAttribute('height')),
            flipX: subTexture.getAttribute('flipX') === 'true',
            flipY: subTexture.getAttribute('flipY') === 'true'
          };
          animations[animationName][frameNum] = frameData;
          frames.push(frameData);
        }
        return { animations, frames };
      }

      if (format === 'json') {
        try {
          const json = JSON.parse(data);
          return {
            animations: json.animations || {},
            frames: json.frames || []
          };
        } catch {
          return { animations: {}, frames: [] };
        }
      }

      if (format === 'ini') {
        const animations = {};
        const frames = [];
        const lines = data.split('\n');
        let currentAnim = '';
        let inFrameSection = false;
        let frameIndex = 0;

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const section = trimmed.slice(1, -1);
            if (section === 'frames') {
              inFrameSection = true;
              frameIndex = 0;
            } else {
              currentAnim = section;
              animations[currentAnim] = [];
              inFrameSection = false;
            }
          } else if (inFrameSection && currentAnim) {
            const coords = trimmed.split(',').map(Number);
            if (coords.length >= 4) {
              const frameData = {
                name: `${currentAnim}${frameIndex.toString().padStart(4, '0')}`,
                x: coords[0],
                y: coords[1],
                width: coords[2],
                height: coords[3],
                frameX: 0,
                frameY: 0,
                frameWidth: coords[2],
                frameHeight: coords[3],
                flipX: false,
                flipY: false
              };
              animations[currentAnim][frameIndex] = frameData;
              frames.push(frameData);
              frameIndex++;
            }
          }
        }
        return { animations, frames };
      }

      if (format === 'txt') {
        const animations = {};
        const frames = [];
        const lines = data.split('\n');
        let currentAnim = '';
        let readingFrames = false;
        let frameIndex = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('anim:')) {
            currentAnim = line.substring(5);
            animations[currentAnim] = [];
            readingFrames = false;
            frameIndex = 0;
          } else if (line === '') {
            if (currentAnim && !readingFrames) {
              readingFrames = true;
            } else {
              currentAnim = '';
              readingFrames = false;
            }
          } else if (readingFrames && currentAnim) {
            const coords = line.split(',').map(Number);
            if (coords.length >= 4) {
              const frameData = {
                name: `${currentAnim}${frameIndex.toString().padStart(4, '0')}`,
                x: coords[0],
                y: coords[1],
                width: coords[2],
                height: coords[3],
                frameX: 0,
                frameY: 0,
                frameWidth: coords[2],
                frameHeight: coords[3],
                flipX: false,
                flipY: false
              };
              animations[currentAnim][frameIndex] = frameData;
              frames.push(frameData);
              frameIndex++;
            }
          }
        }
        return { animations, frames };
      }

      return { animations: {}, frames: [] };
    }

    getFrameFromAnimation(args) {
      return new Promise(resolve => {
        const animation = args.animation;
        let frame = args.frame;
        const format = args.format;
        const input = args.input;
        const dataurl = args.dataurl;

        if (frame > 0) frame = frame - 1;
        const sheetData = this.parseSheetData(input, format);
        
        let animFrames;
        if (animation in sheetData.animations) {
          animFrames = sheetData.animations[animation];
        } else {
          for (const [animName, frames] of Object.entries(sheetData.animations)) {
            if (animName.startsWith(animation)) {
              animFrames = frames;
              break;
            }
          }
        }
        
        if (!animFrames || frame < 0 || frame >= animFrames.length || !animFrames[frame]) {
          resolve('');
          return;
        }

        const frameData = animFrames[frame];
        if (!dataurl || !dataurl.startsWith('data:image/png')) {
          resolve('');
          return;
        }

        const img = new Image();
        img.src = dataurl;
        img.onload = () => {
          const frameWidth = frameData.frameWidth || frameData.width;
          const frameHeight = frameData.frameHeight || frameData.height;
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = frameData.width;
          canvas.height = frameData.height;
          
          if (frameData.flipX || frameData.flipY) {
            ctx.translate(frameData.flipX ? frameData.width : 0, frameData.flipY ? frameData.height : 0);
            ctx.scale(frameData.flipX ? -1 : 1, frameData.flipY ? -1 : 1);
          }
          
          ctx.drawImage(img, frameData.x, frameData.y, frameWidth, frameHeight, -frameData.frameX, -frameData.frameY, frameData.width, frameData.height);
          
          const finalCanvas = document.createElement('canvas');
          const finalCtx = finalCanvas.getContext('2d');
          finalCanvas.width = frameWidth;
          finalCanvas.height = frameHeight;
          finalCtx.drawImage(canvas, 0, 0, frameData.width, frameData.height, 0, 0, frameWidth, frameHeight);
          
          finalCanvas.toBlob(blob => {
            if (!blob) {
              resolve('');
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          }, 'image/png');
        };
        img.onerror = () => resolve('');
      });
    }

    convertFormat(args) {
      const fromFormat = args.fromFormat;
      const toFormat = args.toFormat;
      const data = args.data;
      if (!data) return '';
      if (fromFormat === toFormat) return data;

      const sheetData = this.parseSheetData(data, fromFormat);
      if (toFormat === 'xml') {
        const subTextures = [];
        for (const [animName, animFrames] of Object.entries(sheetData.animations)) {
          if (Array.isArray(animFrames)) {
            animFrames.forEach((frame, index) => {
              if (frame) {
                const frameData = {
                  name: `${animName}${index.toString().padStart(4, '0')}`,
                  x: frame.x || 0,
                  y: frame.y || 0,
                  width: frame.width || 0,
                  height: frame.height || 0,
                  frameX: frame.frameX || 0,
                  frameY: frame.frameY || 0,
                  frameWidth: frame.frameWidth || frame.width || 0,
                  frameHeight: frame.frameHeight || frame.height || 0,
                  flipX: frame.flipX || false,
                  flipY: frame.flipY || false
                };
                subTextures.push(frameData);
              }
            });
          }
        }
        
        let xml = `<?xml version="1.0" encoding="utf-8"?>
<TextureAtlas imagePath="spritesheet.png">
`;
        for (const sub of subTextures) {
          let attrs = `    <SubTexture name="${sub.name}" x="${sub.x}" y="${sub.y}" width="${sub.width}" height="${sub.height}"`;
          if (sub.frameX !== 0 || sub.frameY !== 0 || sub.frameWidth !== sub.width || sub.frameHeight !== sub.height) {
            attrs += ` frameX="${sub.frameX}" frameY="${sub.frameY}" frameWidth="${sub.frameWidth}" frameHeight="${sub.frameHeight}"`;
          }
          if (sub.flipX) attrs += ' flipX="true"';
          if (sub.flipY) attrs += ' flipY="true"';
          attrs += '/>\n';
          xml += attrs;
        }
        xml += '</TextureAtlas>';
        return xml;
      }

      if (toFormat === 'json') {
        return JSON.stringify({
          meta: { format: "JSON Animation Data", version: "1.0" },
          animations: sheetData.animations,
          frames: sheetData.frames
        });
      }

      if (toFormat === 'ini') {
        let result = '';
        for (const [animName, animFrames] of Object.entries(sheetData.animations)) {
          if (Array.isArray(animFrames)) {
            result += `[${animName}]\n`;
            result += '[frames]\n';
            animFrames.forEach(frame => {
              if (frame) {
                result += `${frame.x},${frame.y},${frame.width},${frame.height}\n`;
              }
            });
            result += '\n';
          }
        }
        return result;
      }

      if (toFormat === 'txt') {
        let result = JSON.stringify(this.simpleSheet.config) + '\n \n';
        for (const [animName, animFrames] of Object.entries(sheetData.animations)) {
          if (Array.isArray(animFrames)) {
            result += `anim:${animName}\n`;
            result += JSON.stringify({ fps: 12 }) + '\n';
            animFrames.forEach(frame => {
              if (frame) {
                result += `${frame.x},${frame.y},${frame.width},${frame.height}\n`;
              }
            });
            result += ' \n';
          }
        }
        return result;
      }

      return data;
    }

    getAnimationsCount(args) {
      const sheetData = args.sheetData;
      const format = args.format;
      const parsed = this.parseSheetData(sheetData, format);
      return Object.keys(parsed.animations).length;
    }

    getAnimationFramesCount(args) {
      const animation = args.animation;
      const sheetData = args.sheetData;
      const format = args.format;
      const parsed = this.parseSheetData(sheetData, format);
      
      let animFrames;
      if (animation in parsed.animations) {
        animFrames = parsed.animations[animation];
      } else {
        for (const [animName, frames] of Object.entries(parsed.animations)) {
          if (animName.startsWith(animation)) {
            animFrames = frames;
            break;
          }
        }
      }
      
      return animFrames ? animFrames.filter(f => f).length : 0;
    }

    getTotalFramesCount(args) {
      const sheetData = args.sheetData;
      const format = args.format;
      const parsed = this.parseSheetData(sheetData, format);
      return parsed.frames.length;
    }

    checkAnimationExists(args) {
      const animation = args.animation;
      const sheetData = args.sheetData;
      const format = args.format;
      const parsed = this.parseSheetData(sheetData, format);
      
      if (animation in parsed.animations) return true;
      
      for (const animName of Object.keys(parsed.animations)) {
        if (animName.startsWith(animation)) {
          return true;
        }
      }
      
      return false;
    }

    checkFrameExists(args) {
      const animation = args.animation;
      let frame = args.frame;
      const sheetData = args.sheetData;
      const format = args.format;
      if (frame > 0) frame = frame - 1;
      const parsed = this.parseSheetData(sheetData, format);
      
      let animFrames;
      if (animation in parsed.animations) {
        animFrames = parsed.animations[animation];
      } else {
        for (const [animName, frames] of Object.entries(parsed.animations)) {
          if (animName.startsWith(animation)) {
            animFrames = frames;
            break;
          }
        }
      }
      
      return animFrames && frame >= 0 && frame < animFrames.length && animFrames[frame];
    }

    getAnimationsList(args) {
      const sheetData = args.sheetData;
      const format = args.format;
      const parsed = this.parseSheetData(sheetData, format);
      return JSON.stringify(Object.keys(parsed.animations));
    }

    getAnimationFramesList(args) {
      const animation = args.animation;
      const sheetData = args.sheetData;
      const format = args.format;
      const parsed = this.parseSheetData(sheetData, format);
      
      let animFrames;
      if (animation in parsed.animations) {
        animFrames = parsed.animations[animation];
      } else {
        for (const [animName, frames] of Object.entries(parsed.animations)) {
          if (animName.startsWith(animation)) {
            animFrames = frames;
            break;
          }
        }
      }
      
      if (!animFrames) return '[]';
      const frameNames = animFrames.filter(f => f).map(f => f.name);
      return JSON.stringify(frameNames);
    }

    getFrameCoordinates(args) {
      const animation = args.animation;
      let frame = args.frame;
      const sheetData = args.sheetData;
      const format = args.format;
      if (frame > 0) frame = frame - 1;
      const parsed = this.parseSheetData(sheetData, format);
      
      let animFrames;
      if (animation in parsed.animations) {
        animFrames = parsed.animations[animation];
      } else {
        for (const [animName, frames] of Object.entries(parsed.animations)) {
          if (animName.startsWith(animation)) {
            animFrames = frames;
            break;
          }
        }
      }
      
      if (!animFrames || frame < 0 || frame >= animFrames.length || !animFrames[frame]) return '{}';
      return JSON.stringify(animFrames[frame]);
    }

    getAllFramesList(args) {
      const sheetData = args.sheetData;
      const format = args.format;
      const parsed = this.parseSheetData(sheetData, format);
      const frameNames = parsed.frames.map(f => f.name);
      return JSON.stringify(frameNames);
    }

    flipImage(args) {
      return new Promise(resolve => {
        const image = args.image;
        const flipX = args.flipX;
        const flipY = args.flipY;
        if (!image || !image.startsWith('data:image/png')) {
          resolve('');
          return;
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (flipX || flipY) {
            ctx.translate(flipX ? canvas.width : 0, flipY ? canvas.height : 0);
            ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(blob => {
            if (!blob) {
              resolve('');
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          }, 'image/png');
        };
        img.onerror = () => resolve('');
        img.src = image;
      });
    }

    clearSimpleSheet() {
      this.simpleSheet = {
        animations: {},
        blankFrames: {},
        finalImage: '',
        config: {
          resize: 'off',
          orientation: 'horizontal',
          padding: 6,
          dupeMissingFrames: 'off'
        }
      };
    }

    setSimpleSheet(args) {
      const filetype = args.filetype;
      const content = args.content;
      if (filetype === 'png' || filetype === 'dataurl') {
        this.simpleSheet.finalImage = content;
      } else if (filetype === 'json') {
        try {
          const jsonData = JSON.parse(content);
          this.simpleSheet.animations = jsonData.animations || {};
          this.simpleSheet.blankFrames = jsonData.blankFrames || {};
          this.simpleSheet.config = jsonData.config || this.simpleSheet.config;
          this.generateSimpleSheetImage();
        } catch (e) {
        }
      } else if (filetype === 'txt') {
        const parsed = this.parseSheetData(content, 'txt');
        this.simpleSheet.animations = {};
        for (const [animName, animFrames] of Object.entries(parsed.animations)) {
          this.simpleSheet.animations[animName] = animFrames.map(frame => {
            if (!frame) return null;
            const canvas = document.createElement('canvas');
            canvas.width = frame.width;
            canvas.height = frame.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/png');
          });
        }
        this.generateSimpleSheetImage();
      }
    }

    getSimpleSheet(args) {
      const filetype = args.filetype;
      if (filetype === 'png' || filetype === 'dataurl') {
        return this.simpleSheet.finalImage || '';
      } else if (filetype === 'json') {
        const jsonData = {
          animations: this.simpleSheet.animations,
          blankFrames: this.simpleSheet.blankFrames,
          config: this.simpleSheet.config
        };
        return JSON.stringify(jsonData);
      } else if (filetype === 'txt') {
        let result = JSON.stringify(this.simpleSheet.config) + '\n \n';
        for (const [animName, animFrames] of Object.entries(this.simpleSheet.animations)) {
          result += `anim:${animName}\n`;
          result += JSON.stringify({ fps: 12 }) + '\n';
          animFrames.forEach(frame => {
            if (frame) {
              const img = new Image();
              img.src = frame;
              result += `0,0,${img.width},${img.height}\n`;
            } else {
              result += `0,0,0,0\n`;
            }
          });
          result += ' \n';
        }
        return result;
      }
      return '';
    }

    setSimpleSheetFrame(args) {
      let frameNum = args.number;
      const animation = args.animation;
      const dataurl = args.dataurl;
      if (!animation || animation.trim() === '' || !dataurl || !dataurl.startsWith('data:image/png')) return;
      if (!this.simpleSheet.animations[animation]) {
        this.simpleSheet.animations[animation] = [];
        this.simpleSheet.blankFrames[animation] = new Set();
      }
      if (frameNum === -1) {
        frameNum = this.simpleSheet.animations[animation].length;
      } else if (frameNum > 0) {
        frameNum = frameNum - 1;
      }
      const dupeMode = this.simpleSheet.config.dupeMissingFrames;
      const currentLength = this.simpleSheet.animations[animation].length;
      if (frameNum > currentLength) {
        if (dupeMode === 'off') {
          for (let i = currentLength; i < frameNum; i++) {
            this.simpleSheet.animations[animation][i] = null;
            this.simpleSheet.blankFrames[animation].add(i);
          }
        } else if (dupeMode === 'forward') {
          const lastFrame = currentLength > 0 ? this.simpleSheet.animations[animation][currentLength - 1] : null;
          for (let i = currentLength; i < frameNum; i++) {
            this.simpleSheet.animations[animation][i] = lastFrame;
          }
        } else if (dupeMode === 'behind') {
          for (let i = currentLength; i < frameNum; i++) {
            this.simpleSheet.animations[animation][i] = dataurl;
          }
        }
      }
      this.simpleSheet.animations[animation][frameNum] = dataurl;
      this.simpleSheet.blankFrames[animation].delete(frameNum);
      this.generateSimpleSheetImage();
    }

    removeSimpleSheetFrame(args) {
      let frameNum = args.number;
      const animation = args.animation;
      if (!animation || !this.simpleSheet.animations[animation]) return;
      if (frameNum === -1) {
        frameNum = this.simpleSheet.animations[animation].length - 1;
      } else if (frameNum > 0) {
        frameNum = frameNum - 1;
      }
      if (frameNum >= 0 && frameNum < this.simpleSheet.animations[animation].length) {
        this.simpleSheet.animations[animation][frameNum] = undefined;
        this.simpleSheet.blankFrames[animation].delete(frameNum);
        this.generateSimpleSheetImage();
      }
    }

    removeSimpleSheetAnimation(args) {
      const animation = args.animation;
      if (animation && this.simpleSheet.animations[animation]) {
        delete this.simpleSheet.animations[animation];
        delete this.simpleSheet.blankFrames[animation];
        this.generateSimpleSheetImage();
      }
    }

    getSimpleSheetAnimations() {
      return JSON.stringify(Object.keys(this.simpleSheet.animations));
    }

    removeSimpleSheetAnimationByNumber(args) {
      let animationIndex = args.number;
      if (animationIndex === -1) {
        animationIndex = Object.keys(this.simpleSheet.animations).length - 1;
      }
      const animationNames = Object.keys(this.simpleSheet.animations);
      if (animationIndex >= 0 && animationIndex < animationNames.length) {
        const animationName = animationNames[animationIndex];
        delete this.simpleSheet.animations[animationName];
        delete this.simpleSheet.blankFrames[animationName];
        this.generateSimpleSheetImage();
      }
    }

    isSimpleSheetFrame(args) {
      const frameNum = args.number > 0 ? args.number - 1 : 0;
      const animation = args.animation;
      const type = args.type;
      if (!animation || !this.simpleSheet.animations[animation]) {
        return type === 'nonexistent';
      }
      if (frameNum >= this.simpleSheet.animations[animation].length) {
        return type === 'nonexistent';
      }
      const frame = this.simpleSheet.animations[animation][frameNum];
      if (type === 'blank') {
        return frame === null || (this.simpleSheet.blankFrames[animation] && this.simpleSheet.blankFrames[animation].has(frameNum));
      } else if (type === 'nonexistent') {
        return frame === undefined;
      }
      return false;
    }

    generateSimpleSheetImage() {
      const animations = this.simpleSheet.animations;
      const config = this.simpleSheet.config;
      const padding = config.padding || 6;
      const animationNames = Object.keys(animations);
      if (animationNames.length === 0) {
        this.simpleSheet.finalImage = '';
        return;
      }

      let maxFrames = 0;
      for (const animName of animationNames) {
        maxFrames = Math.max(maxFrames, animations[animName].length);
      }
      if (maxFrames === 0) {
        this.simpleSheet.finalImage = '';
        return;
      }

      const allFrames = [];
      if (config.orientation === 'horizontal') {
        for (let frameIndex = 0; frameIndex < maxFrames; frameIndex++) {
          for (const animName of animationNames) {
            const frame = animations[animName][frameIndex];
            if (frame !== undefined) {
              allFrames.push({
                dataurl: frame,
                animation: animName,
                frameIndex: frameIndex
              });
            }
          }
        }
      } else {
        for (const animName of animationNames) {
          for (let frameIndex = 0; frameIndex < maxFrames; frameIndex++) {
            const frame = animations[animName][frameIndex];
            if (frame !== undefined) {
              allFrames.push({
                dataurl: frame,
                animation: animName,
                frameIndex: frameIndex
              });
            }
          }
        }
      }

      if (allFrames.length === 0) {
        this.simpleSheet.finalImage = '';
        return;
      }

      const imagePromises = allFrames.map(item => {
        return new Promise(resolve => {
          if (item.dataurl === null) {
            resolve({
              img: null,
              width: 0,
              height: 0,
              animation: item.animation,
              frameIndex: item.frameIndex
            });
            return;
          }
          const img = new Image();
          img.onload = () => resolve({
            img: img,
            width: img.width,
            height: img.height,
            animation: item.animation,
            frameIndex: item.frameIndex
          });
          img.onerror = () => resolve({
            img: null,
            width: 0,
            height: 0,
            animation: item.animation,
            frameIndex: item.frameIndex
          });
          img.src = item.dataurl;
        });
      });

      Promise.all(imagePromises).then(loadedFrames => {
        const validFrames = loadedFrames.filter(frame => frame.img !== null);
        if (validFrames.length === 0) {
          this.simpleSheet.finalImage = '';
          return;
        }
        let targetWidth = 0;
        let targetHeight = 0;
        if (config.resize !== 'off') {
          if (config.resize === 'up') {
            targetWidth = Math.max(...validFrames.map(frame => frame.width));
            targetHeight = Math.max(...validFrames.map(frame => frame.height));
          } else if (config.resize === 'down') {
            targetWidth = Math.min(...validFrames.map(frame => frame.width));
            targetHeight = Math.min(...validFrames.map(frame => frame.height));
          }
        } else {
          targetWidth = validFrames[0].width;
          targetHeight = validFrames[0].height;
        }

        let totalWidth, totalHeight;
        if (config.orientation === 'horizontal') {
          totalWidth = (targetWidth * animationNames.length * maxFrames) + (padding * (animationNames.length * maxFrames - 1));
          totalHeight = targetHeight;
        } else {
          totalWidth = targetWidth;
          totalHeight = (targetHeight * animationNames.length * maxFrames) + (padding * (animationNames.length * maxFrames - 1));
        }

        const canvas = document.createElement('canvas');
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');

        if (config.orientation === 'horizontal') {
          for (let frameIndex = 0; frameIndex < maxFrames; frameIndex++) {
            for (let animIndex = 0; animIndex < animationNames.length; animIndex++) {
              const animName = animationNames[animIndex];
              const frame = animations[animName][frameIndex];
              if (frame === undefined) continue;
              const frameData = loadedFrames.find(f => f.animation === animName && f.frameIndex === frameIndex);
              if (!frameData || !frameData.img) continue;
              const index = frameIndex * animationNames.length + animIndex;
              const drawX = index * (targetWidth + padding);
              const drawY = 0;
              if (config.resize !== 'off') {
                const scale = Math.min(targetWidth / frameData.width, targetHeight / frameData.height);
                const scaledWidth = frameData.width * scale;
                const scaledHeight = frameData.height * scale;
                const xOffset = (targetWidth - scaledWidth) / 2;
                const yOffset = (targetHeight - scaledHeight) / 2;
                ctx.drawImage(frameData.img, drawX + xOffset, drawY + yOffset, scaledWidth, scaledHeight);
              } else {
                const xOffset = (targetWidth - frameData.width) / 2;
                const yOffset = (targetHeight - frameData.height) / 2;
                ctx.drawImage(frameData.img, drawX + xOffset, drawY + yOffset, frameData.width, frameData.height);
              }
            }
          }
        } else {
          for (let animIndex = 0; animIndex < animationNames.length; animIndex++) {
            for (let frameIndex = 0; frameIndex < maxFrames; frameIndex++) {
              const animName = animationNames[animIndex];
              const frame = animations[animName][frameIndex];
              if (frame === undefined) continue;
              const frameData = loadedFrames.find(f => f.animation === animName && f.frameIndex === frameIndex);
              if (!frameData || !frameData.img) continue;
              const index = animIndex * maxFrames + frameIndex;
              const drawX = 0;
              const drawY = index * (targetHeight + padding);
              if (config.resize !== 'off') {
                const scale = Math.min(targetWidth / frameData.width, targetHeight / frameData.height);
                const scaledWidth = frameData.width * scale;
                const scaledHeight = frameData.height * scale;
                const xOffset = (targetWidth - scaledWidth) / 2;
                const yOffset = (targetHeight - scaledHeight) / 2;
                ctx.drawImage(frameData.img, drawX + xOffset, drawY + yOffset, scaledWidth, scaledHeight);
              } else {
                const xOffset = (targetWidth - frameData.width) / 2;
                const yOffset = (targetHeight - frameData.height) / 2;
                ctx.drawImage(frameData.img, drawX + xOffset, drawY + yOffset, frameData.width, frameData.height);
              }
            }
          }
        }

        canvas.toBlob(blob => {
          if (!blob) return;
          const reader = new FileReader();
          reader.onloadend = () => {
            this.simpleSheet.finalImage = reader.result;
          };
          reader.readAsDataURL(blob);
        }, 'image/png');
      });
    }

    setSimpleSheetResize(args) {
      this.simpleSheet.config.resize = args.resize;
      this.generateSimpleSheetImage();
    }

    setSimpleSheetOrientation(args) {
      this.simpleSheet.config.orientation = args.orientation;
      this.generateSimpleSheetImage();
    }

    setSimpleSheetPadding(args) {
      this.simpleSheet.config.padding = Math.max(0, args.padding);
      this.generateSimpleSheetImage();
    }

    setSimpleSheetDupeMissing(args) {
      this.simpleSheet.config.dupeMissingFrames = args.dupe;
    }

    getSimpleSheetFrame(args) {
      let frameNum = args.number;
      const anim = args.anim;
      if (frameNum > 0) frameNum = frameNum - 1;
      if (!this.simpleSheet.animations[anim] || frameNum < 0 || frameNum >= this.simpleSheet.animations[anim].length) {
        return '';
      }
      const frame = this.simpleSheet.animations[anim][frameNum];
      return frame || '';
    }

    getSimpleSheetFrameFromData(args) {
      return this.getFrameFromAnimation(args);
    }

    getAnimationVariable(args) {
      const variable = args.variable;
      const animation = args.animation;
      return '12';
    }

    setAnimationVariable(args) {
    }

    setPreciseSheet(args) {
      const image = args.image;
      const format = args.format;
      const data = args.data;
      this.focusSheet.dataurl = image || '';
      this.focusSheet.pendingFrames = {};
      if (format === 'json' && data) {
        try {
          const parsed = JSON.parse(data);
          this.focusSheet.json = { 
            cellCountX: parsed.cellCountX || 1,
            cellCountY: parsed.cellCountY || 1,
            cellWidth: parsed.cellWidth || 0,
            cellHeight: parsed.cellHeight || 0
          };
        } catch {
          this.focusSheet.json = {
            cellCountX: 1,
            cellCountY: 1,
            cellWidth: 0,
            cellHeight: 0
          };
        }
      } else {
        this.focusSheet.json = {
          cellCountX: 1,
          cellCountY: 1,
          cellWidth: 0,
          cellHeight: 0
        };
      }
      this.focusSheet.cellContents = {};
      if (image && image.startsWith('data:image/png')) {
        const img = new Image();
        img.onload = () => {
          const totalWidth = img.width;
          const totalHeight = img.height;
          if (this.focusSheet.json.cellCountX > 1 || this.focusSheet.json.cellCountY > 1) {
            const cellWidth = Math.floor(totalWidth / this.focusSheet.json.cellCountX);
            const cellHeight = Math.floor(totalHeight / this.focusSheet.json.cellCountY);
            this.focusSheet.json.cellWidth = cellWidth;
            this.focusSheet.json.cellHeight = cellHeight;
          } else if (this.focusSheet.json.cellWidth > 0 && this.focusSheet.json.cellHeight > 0) {
            this.focusSheet.json.cellCountX = Math.floor(totalWidth / this.focusSheet.json.cellWidth);
            this.focusSheet.json.cellCountY = Math.floor(totalHeight / this.focusSheet.json.cellHeight);
          } else {
            this.focusSheet.json.cellCountX = 1;
            this.focusSheet.json.cellCountY = 1;
            this.focusSheet.json.cellWidth = totalWidth;
            this.focusSheet.json.cellHeight = totalHeight;
          }
          const cellWidth = this.focusSheet.json.cellWidth;
          const cellHeight = this.focusSheet.json.cellHeight;
          const cellCountX = this.focusSheet.json.cellCountX;
          const cellCountY = this.focusSheet.json.cellCountY;
          const canvas = document.createElement('canvas');
          canvas.width = cellWidth;
          canvas.height = cellHeight;
          const ctx = canvas.getContext('2d');
          for (let y = 0; y < cellCountY; y++) {
            for (let x = 0; x < cellCountX; x++) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(
                img,
                x * cellWidth, y * cellHeight, cellWidth, cellHeight,
                0, 0, cellWidth, cellHeight
              );
              canvas.toBlob(blob => {
                if (!blob) return;
                const reader = new FileReader();
                reader.onloadend = () => {
                  const cellKey = `${x},${y}`;
                  this.focusSheet.cellContents[cellKey] = reader.result;
                };
                reader.readAsDataURL(blob);
              }, 'image/png');
            }
          }
        };
        img.src = image;
      }
    }

    createNewSheet() {
      this.focusSheet = {
        dataurl: '',
        json: {
          cellCountX: 1,
          cellCountY: 1,
          cellWidth: 0,
          cellHeight: 0
        },
        cellContents: {},
        pendingFrames: {}
      };
    }

    generatePreciseSheet() {
      return new Promise(resolve => {
        const pendingFrames = this.focusSheet.pendingFrames;
        const cellKeys = Object.keys(pendingFrames);
        if (cellKeys.length === 0 && Object.keys(this.focusSheet.cellContents).length === 0) {
          resolve();
          return;
        }
        for (const cellKey of cellKeys) {
          const [x, y] = cellKey.split(',').map(Number);
          this.focusSheet.cellContents[cellKey] = pendingFrames[cellKey];
          const cellX = x - 1;
          const cellY = y - 1;
          if (cellX >= this.focusSheet.json.cellCountX) {
            this.focusSheet.json.cellCountX = cellX + 1;
          }
          if (cellY >= this.focusSheet.json.cellCountY) {
            this.focusSheet.json.cellCountY = cellY + 1;
          }
        }
        this.focusSheet.pendingFrames = {};
        const cellSize = Math.max(this.focusSheet.json.cellWidth, this.focusSheet.json.cellHeight);
        if (cellSize === 0) {
          let maxSize = 0;
          const imagePromises = [];
          for (const cellKey in this.focusSheet.cellContents) {
            const promise = new Promise(resolveImg => {
              const img = new Image();
              img.onload = () => {
                const size = Math.max(img.width, img.height);
                if (size > maxSize) maxSize = size;
                resolveImg();
              };
              img.onerror = resolveImg;
              img.src = this.focusSheet.cellContents[cellKey];
            });
            imagePromises.push(promise);
          }
          Promise.all(imagePromises).then(() => {
            this.focusSheet.json.cellWidth = maxSize;
            this.focusSheet.json.cellHeight = maxSize;
            this.regeneratePreciseSheet();
            resolve();
          });
        } else {
          this.regeneratePreciseSheet();
          resolve();
        }
      });
    }

    regeneratePreciseSheet() {
      const cellWidth = this.focusSheet.json.cellWidth;
      const cellHeight = this.focusSheet.json.cellHeight;
      const cellCountX = this.focusSheet.json.cellCountX;
      const cellCountY = this.focusSheet.json.cellCountY;
      const canvas = document.createElement('canvas');
      canvas.width = cellCountX * cellWidth;
      canvas.height = cellCountY * cellHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const drawPromises = [];
      for (let y = 0; y < cellCountY; y++) {
        for (let x = 0; x < cellCountX; x++) {
          const cellKey = `${x},${y}`;
          if (this.focusSheet.cellContents[cellKey]) {
            const promise = new Promise(resolveDraw => {
              const img = new Image();
              img.onload = () => {
                const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const xOffset = (cellWidth - scaledWidth) / 2;
                const yOffset = (cellHeight - scaledHeight) / 2;
                ctx.drawImage(
                  img,
                  x * cellWidth + xOffset,
                  y * cellHeight + yOffset,
                  scaledWidth,
                  scaledHeight
                );
                resolveDraw();
              };
              img.onerror = resolveDraw;
              img.src = this.focusSheet.cellContents[cellKey];
            });
            drawPromises.push(promise);
          }
        }
      }
      Promise.all(drawPromises).then(() => {
        canvas.toBlob(blob => {
          if (!blob) return;
          const reader = new FileReader();
          reader.onloadend = () => {
            this.focusSheet.dataurl = reader.result;
          };
          reader.readAsDataURL(blob);
        }, 'image/png');
      });
    }

    getGridCuttingJSON(args) {
      const x = Math.max(1, args.x);
      const y = Math.max(1, args.y);
      const cuttingData = {
        cellCountX: x,
        cellCountY: y,
        cellWidth: 0,
        cellHeight: 0
      };
      return JSON.stringify(cuttingData);
    }

    getPreciseSheetAsset(args) {
      const asset = args.asset;
      if (asset === 'dataurl') return this.focusSheet.dataurl || '';
      if (asset === 'json') return JSON.stringify(this.focusSheet.json);
      return '';
    }

    getCellImage(args) {
      return new Promise(resolve => {
        const x = Math.max(1, args.x) - 1;
        const y = Math.max(1, args.y) - 1;
        const cellKey = `${x},${y}`;
        if (this.focusSheet.cellContents[cellKey]) {
          resolve(this.focusSheet.cellContents[cellKey]);
          return;
        }
        const sheetdataurl = this.focusSheet.dataurl;
        const json = this.focusSheet.json;
        if (!sheetdataurl || !sheetdataurl.startsWith('data:image/png')) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          const totalWidth = img.width;
          const totalHeight = img.height;
          if (totalWidth === 0 || totalHeight === 0) {
            resolve('');
            return;
          }
          let cellWidth, cellHeight;
          if (json.cellCountX && json.cellCountY) {
            cellWidth = Math.floor(totalWidth / json.cellCountX);
            cellHeight = Math.floor(totalHeight / json.cellCountY);
          } else if (json.cellWidth && json.cellHeight) {
            cellWidth = json.cellWidth;
            cellHeight = json.cellHeight;
          } else {
            cellWidth = totalWidth;
            cellHeight = totalHeight;
          }
          const cellCountX = Math.floor(totalWidth / cellWidth);
          const cellCountY = Math.floor(totalHeight / cellHeight);
          if (x < 0 || x >= cellCountX || y < 0 || y >= cellCountY) {
            resolve('');
            return;
          }
          const startX = x * cellWidth;
          const startY = y * cellHeight;
          const canvas = document.createElement('canvas');
          canvas.width = cellWidth;
          canvas.height = cellHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(
            img,
            startX, startY, cellWidth, cellHeight,
            0, 0, cellWidth, cellHeight
          );
          canvas.toBlob(blob => {
            if (!blob) {
              resolve('');
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          }, 'image/png');
        };
        img.onerror = () => resolve('');
        img.src = sheetdataurl;
      });
    }

    getCellDimensions() {
      const json = this.focusSheet.json;
      return JSON.stringify({
        cellWidth: json.cellWidth || 0,
        cellHeight: json.cellHeight || 0
      });
    }

    getSheetJSON() {
      return JSON.stringify(this.focusSheet.json);
    }

    setCellImage(args) {
      const x = Math.max(1, args.x);
      const y = Math.max(1, args.y);
      const image = args.image;
      const cellKey = `${x - 1},${y - 1}`;
      if (!image || !image.startsWith('data:image/png')) return;
      this.focusSheet.pendingFrames[cellKey] = image;
      const cellX = x - 1;
      const cellY = y - 1;
      if (cellX >= this.focusSheet.json.cellCountX) {
        this.focusSheet.json.cellCountX = cellX + 1;
      }
      if (cellY >= this.focusSheet.json.cellCountY) {
        this.focusSheet.json.cellCountY = cellY + 1;
      }
    }

    removeCell(args) {
      const x = Math.max(1, args.x) - 1;
      const y = Math.max(1, args.y) - 1;
      const cellKey = `${x},${y}`;
      delete this.focusSheet.cellContents[cellKey];
      delete this.focusSheet.pendingFrames[cellKey];
      this.regeneratePreciseSheet();
    }

    resizeCells(args) {
      const width = Math.max(1, args.width);
      const height = Math.max(1, args.height);
      this.focusSheet.json.cellWidth = width;
      this.focusSheet.json.cellHeight = height;
      this.regeneratePreciseSheet();
    }

    getExternalCell(args) {
      return new Promise(resolve => {
        const x = Math.max(1, args.x);
        const y = Math.max(1, args.y);
        const image = args.image;
        const format = args.format;
        const data = args.data;
        if (!image || !image.startsWith('data:image/png')) {
          resolve('');
          return;
        }
        const parsed = this.parseSheetData(data, format);
        const cellX = x - 1;
        const cellY = y - 1;
        const frames = parsed.frames;
        const index = cellY * this.focusSheet.json.cellCountX + cellX;
        if (index < 0 || index >= frames.length) {
          resolve('');
          return;
        }
        const frameData = frames[index];
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = frameData.width;
          canvas.height = frameData.height;
          ctx.drawImage(img, frameData.x, frameData.y, frameData.frameWidth || frameData.width, frameData.frameHeight || frameData.height, -frameData.frameX, -frameData.frameY, frameData.width, frameData.height);
          const finalCanvas = document.createElement('canvas');
          const finalCtx = finalCanvas.getContext('2d');
          finalCanvas.width = frameData.frameWidth || frameData.width;
          finalCanvas.height = frameData.frameHeight || frameData.height;
          finalCtx.drawImage(canvas, 0, 0, frameData.width, frameData.height, 0, 0, frameData.frameWidth || frameData.width, frameData.frameHeight || frameData.height);
          finalCanvas.toBlob(blob => {
            if (!blob) {
              resolve('');
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          }, 'image/png');
        };
        img.onerror = () => resolve('');
        img.src = image;
      });
    }

    generateExternalSheet(args) {
      return new Promise(resolve => {
        const image = args.image;
        const format = args.format;
        const data = args.data;
        if (!image || !image.startsWith('data:image/png')) {
          resolve('');
          return;
        }
        const parsed = this.parseSheetData(data, format);
        const frames = parsed.frames;
        if (frames.length === 0) {
          resolve('');
          return;
        }
        const cellWidth = Math.max(...frames.map(f => f.width));
        const cellHeight = Math.max(...frames.map(f => f.height));
        const cellsPerRow = Math.ceil(Math.sqrt(frames.length));
        const cellsPerCol = Math.ceil(frames.length / cellsPerRow);
        const canvas = document.createElement('canvas');
        canvas.width = cellsPerRow * cellWidth;
        canvas.height = cellsPerCol * cellHeight;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          let index = 0;
          for (let y = 0; y < cellsPerCol; y++) {
            for (let x = 0; x < cellsPerRow; x++) {
              if (index >= frames.length) break;
              const frame = frames[index];
              ctx.drawImage(img, frame.x, frame.y, frame.width, frame.height, x * cellWidth, y * cellHeight, frame.width, frame.height);
              index++;
            }
          }
          canvas.toBlob(blob => {
            if (!blob) {
              resolve('');
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
              const resultJson = {
                cellCountX: cellsPerRow,
                cellCountY: cellsPerCol,
                cellWidth: cellWidth,
                cellHeight: cellHeight
              };
              resolve(JSON.stringify({
                image: reader.result,
                json: JSON.stringify(resultJson)
              }));
            };
            reader.readAsDataURL(blob);
          }, 'image/png');
        };
        img.onerror = () => resolve('');
        img.src = image;
      });
    }
  }

  Scratch.extensions.register(new PNGSHEETSEXT());
})(Scratch);