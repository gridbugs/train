const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

var parse_int = parseInt;

function draw_number(img, total_pos_x, total_pos_y, size, pixsize, rotate_times, extra) {
//    var img_data = c.createImageData(size*pixsize, size*pixsize);
    total_pos_x = parse_int(total_pos_x);
    total_pos_y = parse_int(total_pos_y);
    var img_data = c.getImageData(pixsize*total_pos_x, pixsize*total_pos_y, size*pixsize, size*pixsize);
    var data = img_data.data;
    var r,g,b,a,j;
    for(var i=0,offset=0;i<8;i++) {
        var bit = 0;
        do {
            var mask = 1<<bit;
            var x = img[i] & mask ? 255 : 0;
            var y = extra && extra[i] & mask ? 1:0;
            var pos_x = offset%size;
            var pos_y = parse_int(offset/size);

            for(j=0;j<rotate_times;j++) {
                //pos_x--
                //pos_y--
                var _a = pos_x;
                pos_x = size - 1 - pos_y;
                pos_y = _a;
            }
            for (j = 0;j<pixsize;j++) {
                for (var k = 0;k<pixsize;k++) {
                    if ((x&&!extra)||(x&&y)) continue;
                    a = pixsize*pos_x+k;
                    b = pixsize*pos_y+j;
                    var base = (b*size*pixsize+a)*4;
                    r=g=b=0;
                    extra&&((x&&((y&&(1))||(g=b=0,r=255)||1))||(y&&(r=g=b=200))||(r=g=b=50));

                    data[base] = r;
                    data[base+1] = g;
                    data[base+2] = b;
                    data[base+3] = 255;
                }
            }
            offset ++;
        } while(++bit < 32);
    }
    c.putImageData(img_data, pixsize*total_pos_x, pixsize*total_pos_y);
}
var a=0x8001dffb;
var b=0xdffb8001;
var tracks = [[a,b,a,b,a,b,a,b],
            [0x9fffffff,0x80ff1dff,0x987f98ff,0x339f933f,0x27c327c7,0xc370f07,0x38110f7,0xc07b8001]];
a=0xc003c003;
var train0 = [0xffffffff,0xfe7fffff,0xfc3ffc3f,0xfc3ffe3f,0xfc0ffc0f,0xc003c003,a,a];
var train1 = [0xf81ffe7f,0xe007e007,0xe187e187,0xe3c7e1c7,0xe3f7e3f7,0xc7c3c7e3,0xc003c7c3,0xc003c003];

/*
draw_number(tracks[0], 0, 0, 16, 4, 0);
draw_number(tracks[1], 0, 16, 16, 4, 3);
draw_number(tracks[1], 16, 16, 16, 4, 1);
draw_number(tracks[0], 16, 32, 16, 4, 0);
*/

function draw_piece(piece, pos_x, pos_y, tile_size, pixsize, rotation) {
    for (var i = 0;i<8;i++) {
        if ((1<<i)&piece) {
            var x = i%3;
            var y = parse_int(i/3);
            for (var j=0;j<rotation;j++) {
                var tmp = x;
                x=2-y;
                y=tmp;
            }
            draw_number(tracks[(piece>>(8+i))&1], pos_x+x*tile_size, pos_y+y*tile_size, tile_size, pixsize, (((piece>>(16+2*i))&3)+rotation)%4);
        }
    }
}

/*
 *  16-31: rotations
 *  8-15: image 0->straight, 1->curve
 *  0-7: which cells are used
 */

var pieces = [
    /* straight down in middle row */
    /* 0... 1001 0010 0x92 */
    146,
    /* /--
     * |
     * |
     * 0... 00010100 00000001 01001111 0x14014f */
     1311055,
     /*  /-
      *  |
      * -/
      * 0...            1001 0000 0001 0000 10000010 11010110 0x901082d6 */
      2417001174,
     /*   |
      * /-/
      * | 
      * 0... 00001001 00000000 00101000 01111100 0x900287c */
      151005308,
      /* -\
       *  |
       * -/
       *          1001 0000 0000 0101 10000010 11010011 0x900582d3 */
       2416280275
];

var WIDTH = 20;
var HEIGHT = 12;
var cell_size = 16;
var current_piece = pieces[3];


var grid = [];
var x=0,y=0;
var pixsize = 4;
var rotation = 0;
var illegal = 0;

var grid = [];
for (var i = 0;i<WIDTH;i++) {
    grid[i] = [];
}

var train_position = [0, 16*4];
var train_rotation = 1;

grid[0][4] = grid[1][4] = 10;

// directions
// of the index, bit 0: track type, bit 1-2: rotation
//
//    0
//   ___
// 3 | |  1
//   ---
//    2
// 
// 000: 0, 2 0101   0x5
// 001: 1, 2 0110   0x6
// 010: 1, 3 1010   0xa
// 011: 2, 3 1100   0xc
// 100: 0, 2 0101   0x5
// 101: 0, 3 1001   0x9
// 110: 1, 3 1010   0xa
// 111: 0, 1 0011   0x3
//
// 0x3a95ca65
// 982895205
var exit_direction_map = 982895205;

function flip_heading(h) {
    return (h+2)%4;
}

function exit_direction(heading, tile) {
    if (tile == undefined) {
        return -1;
    }
    var a = ((exit_direction_map>>(tile*4))&15)&(~(1<<flip_heading(heading)));
    if (a == 0) {
        return -1;
    }
    //console.debug(a);
    return Math.log2(a);
}

//console.debug(exit_direction(1, 3));

window.onmousemove = function(e) {
    x=e.x/pixsize,y=e.y/pixsize;
    
}
window.onkeypress = function(e) {
    e.which==32&&(rotation = (rotation + 1)%4)
}

window.onmousedown = function() {
    var base_x = parse_int(0.5+x/cell_size);
    var base_y = parse_int(0.5+y/cell_size);
    for (var i = 0;i<8;i++) {
        if ((1<<i)&current_piece) {
            var _x = i%3;
            var _y = parse_int(i/3);
            for (var _j=0;_j<rotation;_j++) {
                var tmp = _x;
                _x=2-_y;
                _y=tmp;
            }

            var r = (((current_piece>>(16+2*i))&3)+rotation)%4;
            illegal||(grid[base_x+_x][base_y+_y] = ((current_piece>>(8+i))&1)|(r<<1));
        }
    }

    illegal||(current_piece=pieces[parse_int(Math.random()*5)])
}

function tick() {
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
 
    var candidate_coord = [parse_int(0.5+x/cell_size), parse_int(0.5+y/cell_size)];
    illegal = 0;
    for (var i = 0;i<8;i++) {
        if ((1<<i)&current_piece) {
            var _x = i%3;
            var _y = parse_int(i/3);
            for (var _j=0;_j<rotation;_j++) {
                var tmp = _x;
                _x=2-_y;
                _y=tmp;
            }
            
            if (grid[candidate_coord[0]+_x] && 
                grid[candidate_coord[0]+_x][candidate_coord[1]+_y]!=undefined) {
                illegal = 1;
                c.fillStyle = "red";
            } else {
                c.fillStyle = "rgb(0,255,0)";
            }
            c.beginPath();
            c.fillRect((candidate_coord[0]+_x)*cell_size*pixsize, (candidate_coord[1]+_y)*cell_size*pixsize, cell_size*pixsize, cell_size*pixsize);
            c.fill();

            
        }
    }

    for (var i = 0;i<HEIGHT;i++) {
        for (var j = 0;j<WIDTH;j++) {
            if (grid[j] && grid[j][i] != undefined) {
                draw_number(tracks[grid[j][i]&1], j*cell_size, i*cell_size, cell_size, pixsize, grid[j][i]>>1);
            }
        }
    }




    draw_number(train0, train_position[0], train_position[1], 
            16, pixsize, train_rotation, train1);

    draw_piece(current_piece, x, y, 16, pixsize, rotation);
    
    requestAnimationFrame(tick);
}
tick();
var score = -3;
function update_position() {
    if (train_position[0] % 16 == 0 && train_position[1] % 16 == 0) {
        var tile = grid[train_position[0]/16][train_position[1]/16];
        var exit_dir = exit_direction(train_rotation, tile);
        score++;
        if (exit_dir == -1) {
            alert('The train has crashed! Score: ' + score);
            return;
        }
        train_rotation = exit_dir;
    }

    switch(train_rotation) {
        case 0: train_position[1]--;break;
        case 1: train_position[0]++;break;
        case 2: train_position[1]++;break;
        case 3: train_position[0]--;break;
    }
}
setInterval(update_position, 100);
