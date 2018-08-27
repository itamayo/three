/**
 * @author Filipe Caixeta / http://filipecaixeta.com.br
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Description: A THREE loader for PCD ascii and binary files.
 *
 * Limitations: Compressed binary files are not supported.
 *
 */
import {Group} from '../objects/Group';
import {FileLoader} from './FileLoader';
import { BufferGeometry } from '../core/BufferGeometry';
import { Float32BufferAttribute } from '../core/BufferAttribute';
import { DefaultLoadingManager } from './LoadingManager';
import {Points} from '../objects/Points';
import {PointsMaterial} from '../materials/PointsMaterial';
import {LoaderUtils} from './LoaderUtils';
function PCDLoader ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;
	this.littleEndian = true;

}

Object.assign(PCDLoader.prototype,{
	load: function ( url, coloring, onLoad, onProgress, onError ) {
		var myWorker = new Worker('/assets/PcdWorker.js');

		var scope = this;


		var loader = new FileLoader( scope.manager );
		loader.setResponseType( 'arraybuffer' );
		loader.load( url, function ( data ) {

			onLoad( scope.parse( data, coloring, url,myWorker ) );

		}, onProgress, onError );

	},

	parse: function ( data, coloring, url,myWorker ) {
	
		var PCDheader = {};
		var gr = new Group();

		myWorker.postMessage([{type:'initialize'},data, coloring]);
		myWorker.onmessage=function(ev){
			if (ev.data[0].type=="initialized"){
			 PCDheader = ev.data[1].PCDheader;

		// ascii

		if ( PCDheader.data === 'ascii' ) {

			var offset = PCDheader.offset;
			var pcdData = textData.substr( PCDheader.headerLen );
			var lines = pcdData.split( '\n' );

			for ( var i = 0, l = lines.length; i < l; i ++ ) {

				var line = lines[ i ].split( ' ' );

				if ( offset.x !== undefined ) {

					position.push( parseFloat( line[ offset.x ] ) );
					position.push( parseFloat( line[ offset.y ] ) );
					position.push( parseFloat( line[ offset.z ] ) );

				}

				if ( offset.rgb !== undefined ) {

					var c = new Float32Array( [ parseFloat( line[ offset.rgb ] ) ] );
					var dataview = new DataView( c.buffer, 0 );
					color.push( dataview.getUint8( 0 ) / 255.0 );
					color.push( dataview.getUint8( 1 ) / 255.0 );
					color.push( dataview.getUint8( 2 ) / 255.0 );

				}

				if ( offset.normal_x !== undefined ) {

					normal.push( parseFloat( line[ offset.normal_x ] ) );
					normal.push( parseFloat( line[ offset.normal_y ] ) );
					normal.push( parseFloat( line[ offset.normal_z ] ) );

				}

			}

		}

		// binary

		if ( PCDheader.data === 'binary_compressed' ) {

			console.error( 'THREE.PCDLoader: binary_compressed files are not supported' );
			return;

		}


			if ( PCDheader.data === 'binary' ) {
				myWorker.postMessage([{type:'process'},data,coloring,PCDheader]);
		}
	 }

		// build geometry

	if (ev.data[0].type=="processed"){
		this.terminate();
		var position1 = ev.data[1].position1;
		var normal1 = ev.data[1].normal1;
		var color1 = ev.data[1].color1;
		var intensity1 = ev.data[1].intensity1;
		var position2 = ev.data[1].position2;
		var normal2 = ev.data[1].normal2;
		var color2 = ev.data[1].color2;
		var intensity2 = ev.data[1].intensity2;
		var pointSize = ev.data[1].pointSize;
		var d1 = new Date().getTime();
		var geometry1 = new BufferGeometry();
		var geometry2 = new BufferGeometry();
		var position3;
		//create array if empty
		if(!position1.array){
			position1.array = [];
		}
		if(!position2.array){
			position2.array = [];
		}
		if ( position1.array && position2.array){
			position3 = new Float32Array(position1.array.length + position2.array.length);
			geometry1.addAttribute( 'position', new Float32BufferAttribute(position3,3));
			geometry2.addAttribute( 'position', new Float32BufferAttribute(position3,3));
			for(var i = 0; i < position1.array.length; i++){
				geometry1.attributes.position.array[i] = position1.array[i];
			}
			geometry1.setDrawRange( 0, position1.array.length );
			for(var i = 0; i < position2.array.length; i++){
				geometry2.attributes.position.array[i] = position2.array[i];
			}
			geometry2.setDrawRange( 0, position2.array.length );
		}
		
		if(!position3){
			console.log("ERROR: point cloud not loaded correctly")
		}
		geometry1.addAttribute( 'normal', new Float32BufferAttribute(position3,3));
		if ( normal1.array ) {
			for(var i = 0; i < normal1.array.length; i++){
				geometry1.attributes.normal.array[i] = normal1.array[i];
			}
		}
		geometry1.addAttribute( 'color', new Float32BufferAttribute(position3,3));
		if ( color1.array ) {
			for(var i = 0; i < color1.array.length; i++){
				geometry1.attributes.color.array[i] = color1.array[i];
			}
		}
		geometry1.addAttribute( 'intensity', new Float32BufferAttribute(position3,1));
		if ( intensity1.array ) {
			for(var i = 0; i < intensity1.array.length; i++){
				geometry1.attributes.intensity.array[i] = intensity1.array[i];
			}
		}
		geometry2.addAttribute( 'normal', new Float32BufferAttribute(position3,3));
		if ( normal2.array ) {
			for(var i = 0; i < normal2.array.length; i++){
				geometry2.attributes.normal.array[i] = normal2.array[i];
			}
		}
		geometry2.addAttribute( 'color', new Float32BufferAttribute(position3,3));
		if ( color2.array ) {
			for(var i = 0; i < color2.array.length; i++){
				geometry2.attributes.color.array[i] = color2.array[i];
			}
		}
		geometry2.addAttribute( 'intensity', new Float32BufferAttribute(position3,1));
		if ( intensity2.array ) {
			for(var i = 0; i < intensity2.array.length; i++){
				geometry2.attributes.intensity.array[i] = intensity2.array[i];
			}
		}
		var d2 = new Date().getTime();
		console.log("DIFF",d2-d1);
		geometry1.computeBoundingSphere();
		geometry2.computeBoundingSphere();


		// build material

		var material1 = new PointsMaterial( { size: pointSize, lights: false, color: null, sizeAttenuation: false} );
		var material2 = new PointsMaterial( { size: pointSize, lights: false , color: null, sizeAttenuation: false } );
		if ( color1.count > 0 ) {

			material1.vertexColors = true;

		} else {

			//material1.color.setHex(0x6CA6CD);

		}

		if ( color2.count > 0 ) {

			material2.vertexColors = true;

		} else {

			//material2.color.setHex(0x6CA6CD);

		}

		// build mesh

		var mesh1 = new Points( geometry1, material1 );
		var name1 = url.split( '' ).reverse().join( '' );
		name1 = /([^\/]*)/.exec( name1 );
		name1 = name1[ 1 ].split( '' ).reverse().join( '' );
		mesh1.name = name1 + '_not_visible';

		var mesh2 = new Points( geometry2, material2 );
		var name2 = url.split( '' ).reverse().join( '' );
		name2 = /([^\/]*)/.exec( name2 );
		name2 = name2[ 1 ].split( '' ).reverse().join( '' );
		mesh2.name = name2;



		gr.add(mesh1);
		gr.add(mesh2);
		gr.name = name1;
	}
 };
	var promise = new Promise(function(resolve,reject){
		var idx = setInterval(function(){
					if (typeof gr !=="undefined" && gr.children.length!=0){
							clearInterval(idx);
							resolve(gr);
					}
			},500);

	});

		return promise;
	}

});
export { PCDLoader };
