# Roads from 3D relief and bridges

Update drag-and-dropped files by raycasting on 3DTiles models. The files must be **GeoJson** files containing `LineString` or `MultiLineString` features. The coordinates of those lines will be updated with the altitude (Z coordinate) of the raycast intersection point.  
The raycast only works on visible 3DTiles layers. If you don't want to use relief/bridges to update your altitudes, you can hide the corresponding layer with the `LayerChoice` widget.

Set layers visible/invisible:

![visible](screenshot/visible_layers.png)

Drag and drop:

![gif](screenshot/roads_d&d.gif)

Roads **before** update:

![before](screenshot/roads_before.png)

Roads **after** update:

![after](screenshot/roads_after.png)

## Install and run application

The application can be locally (on your desktop) started in the following way

```bash
npm install
npm run debug
```

and then use your favorite (web) browser to open
`http://localhost:8000/`.

A docker version is available [here](https://github.com/VCityTeam/UD-Demo-VCity-UI-driven-data-computation-Lyon-docker).
