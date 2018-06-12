/**
 * @author Filipe Caixeta / http://filipecaixeta.com.br
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Description: A THREE loader for PCD ascii and binary files.
 *
 * Limitations: Compressed binary files are not supported.
 *
 */
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

};


Object.assign(PCDLoader.prototype,{
	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new FileLoader( scope.manager );
		loader.setResponseType( 'arraybuffer' );
		loader.load( url, function ( data ) {

			onLoad( scope.parse( data, url ) );

		}, onProgress, onError );

	},

	parse: function ( data, url ) {

		function parseHeader( data ) {

			var PCDheader = {};
			var result1 = data.search( /[\r\n]DATA\s(\S*)\s/i );
			var result2 = /[\r\n]DATA\s(\S*)\s/i.exec( data.substr( result1 - 1 ) );

			PCDheader.data = result2[ 1 ];
			PCDheader.headerLen = result2[ 0 ].length + result1;
			PCDheader.str = data.substr( 0, PCDheader.headerLen );

			// remove comments

			PCDheader.str = PCDheader.str.replace( /\#.*/gi, '' );

			// parse

			PCDheader.version = /VERSION (.*)/i.exec( PCDheader.str );
			PCDheader.fields = /FIELDS (.*)/i.exec( PCDheader.str );
			PCDheader.size = /SIZE (.*)/i.exec( PCDheader.str );
			PCDheader.type = /TYPE (.*)/i.exec( PCDheader.str );
			PCDheader.count = /COUNT (.*)/i.exec( PCDheader.str );
			PCDheader.width = /WIDTH (.*)/i.exec( PCDheader.str );
			PCDheader.height = /HEIGHT (.*)/i.exec( PCDheader.str );
			PCDheader.viewpoint = /VIEWPOINT (.*)/i.exec( PCDheader.str );
			PCDheader.points = /POINTS (.*)/i.exec( PCDheader.str );

			// evaluate

			if ( PCDheader.version !== null )
				PCDheader.version = parseFloat( PCDheader.version[ 1 ] );

			if ( PCDheader.fields !== null )
				PCDheader.fields = PCDheader.fields[ 1 ].split( ' ' );

			if ( PCDheader.type !== null )
				PCDheader.type = PCDheader.type[ 1 ].split( ' ' );

			if ( PCDheader.width !== null )
				PCDheader.width = parseInt( PCDheader.width[ 1 ] );

			if ( PCDheader.height !== null )
				PCDheader.height = parseInt( PCDheader.height[ 1 ] );

			if ( PCDheader.viewpoint !== null )
				PCDheader.viewpoint = PCDheader.viewpoint[ 1 ];

			if ( PCDheader.points !== null )
				PCDheader.points = parseInt( PCDheader.points[ 1 ], 10 );

			if ( PCDheader.points === null )
				PCDheader.points = PCDheader.width * PCDheader.height;

			if ( PCDheader.size !== null ) {

				PCDheader.size = PCDheader.size[ 1 ].split( ' ' ).map( function ( x ) {

					return parseInt( x, 10 );

				} );

			}

			if ( PCDheader.count !== null ) {

				PCDheader.count = PCDheader.count[ 1 ].split( ' ' ).map( function ( x ) {

					return parseInt( x, 10 );

				} );

			} else {

				PCDheader.count = [];

				for ( var i = 0, l = PCDheader.fields.length; i < l; i ++ ) {

					PCDheader.count.push( 1 );

				}

			}

			PCDheader.offset = {};

			var sizeSum = 0;

			for ( var i = 0, l = PCDheader.fields.length; i < l; i ++ ) {

				if ( PCDheader.data === 'ascii' ) {

					PCDheader.offset[ PCDheader.fields[ i ] ] = i;

				} else {

					PCDheader.offset[ PCDheader.fields[ i ] ] = sizeSum;
					sizeSum += PCDheader.size[ i ];

				}

			}

			// for binary only

			PCDheader.rowSize = sizeSum;

			return PCDheader;

		}

		var textData = LoaderUtils.decodeText( data );

		// parse header (always ascii format)

		var PCDheader = parseHeader( textData );

		// parse data

		var position1 = [];
		var normal1 = [];
		var color1 = [];
		var position2 = [];
		var normal2 = [];
		var color2 = [];

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

			var dataview = new DataView( data, PCDheader.headerLen );
			var offset = PCDheader.offset;

			for ( var i = 0, row = 0; i < PCDheader.points; i ++, row += PCDheader.rowSize ) {
				
				
				//separate floor points
				var isFloor = false;
				
				if ( offset.x !== undefined ) {
					if( dataview.getFloat32( row + offset.z, this.littleEndian ) < -0.3 || dataview.getFloat32( row + offset.z, this.littleEndian ) > 0.3){
						isFloor = false;
					}
					else{
						isFloor = true;
					}
				}
					

				if ( offset.x !== undefined ) {

					if(isFloor){
						position2.push( dataview.getFloat32( row + offset.x, this.littleEndian ) );
						position2.push( dataview.getFloat32( row + offset.y, this.littleEndian ) );
						position2.push( dataview.getFloat32( row + offset.z, this.littleEndian ) );
					}
					else{
						position1.push( dataview.getFloat32( row + offset.x, this.littleEndian ) );
						position1.push( dataview.getFloat32( row + offset.y, this.littleEndian ) );
						position1.push( dataview.getFloat32( row + offset.z, this.littleEndian ) );
					}
				}

				if ( offset.rgb !== undefined ) {
					if(isFloor){
						color2.push( dataview.getUint8( row + offset.rgb + 0 ) / 255.0 );
						color2.push( dataview.getUint8( row + offset.rgb + 1 ) / 255.0 );
						color2.push( dataview.getUint8( row + offset.rgb + 2 ) / 255.0 );
					}
					else{
						color1.push( dataview.getUint8( row + offset.rgb + 0 ) / 255.0 );
						color1.push( dataview.getUint8( row + offset.rgb + 1 ) / 255.0 );
						color1.push( dataview.getUint8( row + offset.rgb + 2 ) / 255.0 );
					}
				}
				
				if ( offset.intensity !== undefined ) {
					if(isFloor){
						color2.push( dataview.getUint8( row + offset.intensity + 0 ) / 255.0 );
						color2.push( dataview.getUint8( row + offset.intensity + 0 ) / 255.0 );
						color2.push( dataview.getUint8( row + offset.intensity + 0 ) / 255.0 );
					}
					else{
						color1.push( dataview.getUint8( row + offset.intensity + 0 ) / 255.0 );
						color1.push( dataview.getUint8( row + offset.intensity + 0 ) / 255.0 );
						color1.push( dataview.getUint8( row + offset.intensity + 0 ) / 255.0 );
					}
				}

				if ( offset.normal_x !== undefined ) {
					if(isFloor){
						normal2.push( dataview.getFloat32( row + offset.normal_x, this.littleEndian ) );
						normal2.push( dataview.getFloat32( row + offset.normal_y, this.littleEndian ) );
						normal2.push( dataview.getFloat32( row + offset.normal_z, this.littleEndian ) );
					}
					else{
						normal1.push( dataview.getFloat32( row + offset.normal_x, this.littleEndian ) );
						normal1.push( dataview.getFloat32( row + offset.normal_y, this.littleEndian ) );
						normal1.push( dataview.getFloat32( row + offset.normal_z, this.littleEndian ) );
					}
				}

			}

		}

		// build geometry

		var geometry1 = new BufferGeometry();
		var geometry2 = new BufferGeometry();

		if ( position1.length > 0 ) geometry1.addAttribute( 'position', new Float32BufferAttribute( position1, 3 ) );
		if ( normal1.length > 0 ) geometry1.addAttribute( 'normal', new Float32BufferAttribute( normal1, 3 ) );
		if ( color1.length > 0 ) geometry1.addAttribute( 'color', new Float32BufferAttribute( color1, 3 ) );
		
		if ( position2.length > 0 ) geometry2.addAttribute( 'position', new Float32BufferAttribute( position2, 3 ) );
		if ( normal2.length > 0 ) geometry2.addAttribute( 'normal', new Float32BufferAttribute( normal2, 3 ) );
		if ( color2.length > 0 ) geometry2.addAttribute( 'color', new Float32BufferAttribute( color2, 3 ) );

		geometry1.computeBoundingSphere();
		geometry2.computeBoundingSphere();

		// build material

		var material1 = new PointsMaterial( { size: 0.005 } );
		var material2 = new PointsMaterial( { size: 0.005 } );
		if ( color1.length > 0 ) {

			material1.vertexColors = true;

		} else {

			material1.color.setHex(0x6CA6CD);

		}
		
		if ( color2.length > 0 ) {

			material2.vertexColors = true;

		} else {

			material2.color.setHex(0x6CA6CD);

		}

		// build mesh

		var mesh1 = new Points( geometry1, material1 );
		var name1 = url.split( '' ).reverse().join( '' );
		name1 = /([^\/]*)/.exec( name1 );
		name1 = name1[ 1 ].split( '' ).reverse().join( '' );
		mesh1.name = name1 + '_no_floor';
		
		var mesh2 = new Points( geometry2, material2 );
		var name2 = url.split( '' ).reverse().join( '' );
		name2 = /([^\/]*)/.exec( name2 );
		name2 = name2[ 1 ].split( '' ).reverse().join( '' );
		mesh2.name = name2 + '_floor';
		
		var gr = new Group();
		
		gr.add(mesh1);
		gr.add(mesh2);
		gr.name = name1;
		return gr;

	}

});
export { PCDLoader };
