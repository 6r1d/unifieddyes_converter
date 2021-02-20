/* jshint esversion: 6 */
/* jshint asi: true */

// A color distance function.
// Original idea from: http://www.compuphase.com/cmetric.htm
function color_distance(a, b) {
    // Distances for red, green and blue color
    let dr = a.red - b.red
    let dg = a.green - b.green
    let db = a.blue - b.blue
    // TODO mean value for red values of `a` and `b`?
    let red_mean = (a.red + b.red) / 2
    return (2 + red_mean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - red_mean) / 256) * db * db
}

var get_color_dict = function(context, x, y) {
    let point = context.getImageData(x, y, 1, 1).data
    let color = {
        red: point[0],
        green: point[1],
        blue: point[2]
    }
    return color
}

var calculate_color_indexes = function(cnv) {
    let tree = new kdTree(colors, color_distance, ["red", "green", "blue"])
    let rows = []
    let row
    let context = cnv.getContext('2d')
    for(var x=0; x<cnv.width; x++) {
        row = []
        for(var y=0; y<cnv.height; y++) {
            let color = get_color_dict(context, x, y)
            let nearest = treeNearest(tree, color, 1)
            nearest.sort(function(a, b) {
                return a[1] - b[1]
            })
            row.push(nearest[0][0].num)
        }
        rows.push(row)
    }
    return rows
}

var draw_preview = function(rows, colors) {
    // A canvas element to draw a preview in and a drawing context
    var preview_canvas = document.getElementById('preview_canvas')
    var preview_context = preview_canvas.getContext('2d')
    for(var x=0; x<rows.length; x++) {
       for(var y=0; y<rows[x].length; y++) {
           // Find a color by its number, assuming array indexing is broken
           let current_color = colors.find(c => c.num == rows[x][y])
           // Draw a pixel
           preview_context.fillStyle = current_color.hex
           preview_context.fillRect(x, y, 1, 1)
       }
    }
}

// Update width and height for canvas elements
var canvas_resize = function(width, height) {
    let input_canvas = document.getElementById('input_canvas')
    let preview_canvas = document.getElementById('preview_canvas')
    // Set input canvas size
    input_canvas.setAttribute("width", width)
    input_canvas.setAttribute("height", height)
    // Set result canvas size
    preview_canvas.setAttribute("width", width)
    preview_canvas.setAttribute("height", height)
}

// Display previews, textareas, etc.
var restore_controls = function() {
    $('.hidden').removeClass('hidden')
}

// Convert JS array to Lua table
var js_array_to_ltn = function(arr) {
    let text = "local data = " + JSON.stringify(arr, null, 4).replaceAll("[", "{").replaceAll("]", "}")
    return text
}

var fill_outputs = function(rows) {
    // Set JSON output value
    $('#json_output').val(JSON.stringify(rows, null, 2))
    // Set Lua output value
    let lua_src = js_array_to_ltn(rows)
    $('#lua_output').val(lua_src)
}

// Image loader
var process_file_input = function(event) {
    let input_canvas = document.getElementById('input_canvas')
    let context = input_canvas.getContext('2d')
    let input = event.target
    // Initialize a FileReader to read a new image
    let reader = new FileReader()
    reader.onload = function() {
        var image_instance = new Image()
        // Set dataURL
        image_instance.src = reader.result
        image_instance.onload = function() {
            // Resize both `canvas` elements
            canvas_resize(
                image_instance.width,
                image_instance.height
            )
            restore_controls()
            // Draw initial image
            context.drawImage(
                image_instance,
                0,
                0,
                image_instance.width,
                image_instance.height
            )
            // Find converted color indexes
            let rows = calculate_color_indexes(input_canvas)
            // Display an image preview based on generated rows
            draw_preview(rows, colors)
            // Generate filler text for both textareas
            fill_outputs(rows)
        }
    }
    // Feed an image to FileReader instance
    reader.readAsDataURL(input.files[0])
}
