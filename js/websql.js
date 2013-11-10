//variables globales
var db;
var ubicacion       = "";
var numero_alerta   = 2222222222;
var usuario         = "usuario";

    function init() {
         db = openDatabase("DB glucoday", "0.1", "Database glucoday", 2+1024+1024);
         if (db) {
             // Database opened
             db.transaction( function(tx) {
                 tx.executeSql("CREATE TABLE IF NOT EXISTS usuarios(userid integer primary key autoincrement, username text, password text)")
             });
             
             
                 
            // Database opened and create de table
            db.transaction( function(tx) {
                tx.executeSql("CREATE TABLE  IF NOT EXISTS informacion_usuario(id_usuario integer primary key autoincrement, nombre text, edad text,num_alerta text,tipo text,sexo text)")
            });
            db.transaction( function(tx) {
                tx.executeSql("CREATE TABLE  IF NOT EXISTS mediciones(id_medicion integer primary key autoincrement, tipo_comida text, medicion integer,fecha DATE)")
            });
            db.transaction( function(tx) {
                tx.executeSql("CREATE TABLE  tips(id_tips integer primary key autoincrement, titulo text, imagen text,descripcion text)");
            });
         }

        db.transaction( function(tx) {
            tx.executeSql("SELECT * FROM tips", [],
                function(tx, result){
                    console.log(result.rows.length);
                    if(result.rows.length == 0){
                        tx.executeSql("INSERT INTO tips(titulo, imagen, descripcion) VALUES(?,?,?)", ["El primero", "imagenes/2.png","Con esta comida te sentiras mas ligero ya que  hace tal"]);
                        tx.executeSql("INSERT INTO tips(titulo, imagen, descripcion) VALUES(?,?,?)", ["EL segundo", "imagenes/1.png","Esto te aydara que este mejor"]);
                    }
            });
        });

    }


    $(document).on( "click", ".show-page-loading-msg", function() {
        var $this = $( this ),
        theme = $this.jqmData( "theme" ) || $.mobile.loader.prototype.options.theme,
        msgText = $this.jqmData( "msgtext" ) || $.mobile.loader.prototype.options.text,
        textVisible = $this.jqmData( "textvisible" ) || $.mobile.loader.prototype.options.textVisible,
        textonly = !!$this.jqmData( "textonly" );
        html = $this.jqmData( "html" ) || "";
        $.mobile.loading( 'show', {
        text: msgText,
        textVisible: textVisible,
        theme: theme,
        textonly: textonly,
        html: html
        });
        })
        .on( "click", ".hide-page-loading-msg", function() {
        $.mobile.loading( "hide" );
    });

    // function removeUser(userId) {
    //     db.transaction(function(tx) {
    //         tx.executeSql("DELETE FROM usuarios WHERE userId=?",[userId], listUsers);
    //     })
    // }


    function guardarDatos(nombre,edad,num_alerta,tipo,sexo) {
	  	//validar los datos

	    //guardar los datos
		db.transaction( function(tx) {
                    console.log("inserta");
		            tx.executeSql("INSERT INTO informacion_usuario(nombre, edad, num_alerta,tipo, sexo) VALUES(?,?,?,?,?)", [nombre, edad,num_alerta,tipo,sexo]);
		        });
    }

    //guarla medicion registrada por el usuario
    function guardar_medicion(tipo_comida,medicion){
	     console.log(tipo_comida+" "+medicion);
	    //validar los datos

        var hoy = new Date();
        dia = hoy.getDate();
        mes = hoy.getMonth();
        anio= hoy.getFullYear();

        var fecha_actual = String(anio+"-"+mes+"-"+dia);
        //fecha_actual = new Date(fecha_actual);
        console.log(fecha_actual);

		//guardar los datos
		db.transaction( function(tx) {
		            tx.executeSql("INSERT INTO mediciones(tipo_comida, medicion,fecha) VALUES(?,?,?)", [tipo_comida, medicion,fecha_actual]);
		        });

		//ya que la medicion esta guardada
		//checar si es menor a un rango
		if(medicion > 80){
			//esta en alerta mandamos confirmacion para proceder
            //lanzaremos el popup
            $("#alerta").trigger('click');
		}
		else{
			location.href="index.html#menu";
		}

    }

    
    function alerta(){
		//hacer la geolocalizacion
        
        if (navigator.geolocation){
            navigator.geolocation.getCurrentPosition(showPosition);
        }
        else{
            ubicacion="Geolocation is not supported by this browser.";
        }

        setTimeout(function() {               
            db.transaction( function(tx) {
                console.log("vamos hacer el query");
                tx.executeSql("SELECT * FROM informacion_usuario", [],
                    function(tx, result){
                        var output = [];
                        var mensaje_alerta;
                        var direccion_actual;

                        for(var i=0; i < result.rows.length; i++) {
                            output.push([result.rows.item(i)['id_usuario'],
                                    result.rows.item(i)['nombre'],
                                    result.rows.item(i)['edad'],
                                    result.rows.item(i)['num_alerta'],
                                    result.rows.item(i)['tipo']]);
                        }

                         //sacamos el numero de alerta del utimo registro
                          for ( var i = 0; i < output.length; i++) {
                                    usuario = output[i][1];
                                    numero_alerta = output[i][3];
                                    console.log("llena"+output[i][3]);
                          }

                        if(ubicacion){ 
                            direccion_actual = "" + ubicacion ; //tratar x para que nos de la direccion correcta
                        }    
                        mensaje_alerta = "El Usuario " + usuario +"tiene niveles de glucosa altos en " +direccion_actual;
               

                      enviar_sms(mensaje_alerta,numero_alerta);
                });
            });


         },5000);
         
	    location.href="index.html#menu";
    }

    //funcion que envia el mensaje
    function enviar_sms(men,num){
        //poner el icono
        console.log("numero :"+num);

        //forma para pasar el mensaje a black berry 
        blackberry.message.sms.send(men, num);

          var listener = function (msg, from, date) {
            alert(from+" "+msg+" "+date);
          }

          blackberry.message.sms.isListeningForMessage = true;
          blackberry.message.sms.addReceiveListener(listener);

          if (blackberry.message.sms.removeReceiveListener()){
            alert("Listener removed successfully.");
            blackberry.message.sms.isListeningForMessage = false;
          }


        console.log(mensaje_alerta);
    }

    //nos permite hacer un retardo sincrono 
    function pausecomp(millis)
    {
        var date = new Date();
        var curDate = null;

        do { curDate = new Date(); }
        while(curDate-date < millis);
    } 

    function showPosition(position)
    {
        ubicacion =  "Latitude: " + position.coords.latitude + 
                 "Longitude: " + position.coords.longitude;

        console.log("datos"+ubicacion);

    }



    function actualizar_grafica(fecha_inicial,fecha_final){
       console.log("se va actualizar la grafica"+fecha_inicial+" - "+fecha_final);

        db.transaction( function(tx) {
            tx.executeSql("SELECT * FROM mediciones", [],
                function(tx, result){
					console.log("*****");
                    var output = [];
                    for(var i=0; i < result.rows.length; i++) {
                        output.push([result.rows.item(i)['id_medicion'],
                                result.rows.item(i)['tipo_comida'],
                                result.rows.item(i)['medicion']]);
                    }
					console.log("vamos hacer el query");
                    graficar(output);
                });
        });

    }

    function graficar(info_mediciones){
         //en esta funcion procesaremos los datos para poder hacer la grafica
         //de acuerdo con las fechas que nos da el usuario
         console.log("contenido"+info_mediciones);

         //arrglos para control de grafica
         var desayuno   = [];
         var comida     = [];
         var cena       = [];

         //variables de control para el llenado de los arreglos
         var d  = 0;
         var c  = 0;
         var ce = 0;

        //llenar los arreglos 3 arriglos uno por cada comida
         for ( var i = 0; i < info_mediciones.length; i++) {
                if(info_mediciones[i][1] == 1){
                    console.log("entro 1");
                    desayuno[d] = info_mediciones[i][2];
                    d++;
                }
                else  if(info_mediciones[i][1] == 2){
                    console.log("entro 2");
                    comida[c]   = info_mediciones[i][2];
                    c++;
                }
                else {
                    console.log("entro 3");
                    cena[ce]      = info_mediciones[i][2];
                    ce++;
                }
         }

        var line_desayuno;
        if(desayuno!=0){
            var line_desayuno = new Array(desayuno.length-1);
            for (var i = 0; i < desayuno.length; i++) {
                line_desayuno[i] = new Array(2);
                        };

            for (i=0; i<desayuno.length; i++)
            {
                for (e=0; e<2; e++)
                {
                    if(e == 0){
                        line_desayuno[i][e] =  i;
                    }
                    else{
                        line_desayuno[i][e] =  desayuno[i];
                    }

                }
            }
        }
        else{
             line_desayuno = 0;
        }


         var line_comida;
        if(comida != 0){
            line_comida = new Array(comida.length-1);
            for (var i = 0; i < comida.length; i++) {
                line_comida[i] = new Array(2);
                        };

            for (i=0; i<comida.length; i++)
            {
                for (e=0; e<2; e++)
                {
                    if(e == 0){
                        line_comida[i][e] =  i;
                    }
                    else{
                        line_comida[i][e] =  comida[i];
                    }

                }
            }
        }
        else{
            line_comida=0;
        }

        var linea_cena;
        if(cena!=0){
            linea_cena = new Array(cena.length-1);
            for (var i = 0; i < cena.length; i++) {
                linea_cena[i] = new Array(2);
                        };

            for (i=0; i<cena.length; i++)
            {
                for (e=0; e<2; e++)
                {
                    if(e == 0){
                        linea_cena[i][e] =  i;
                    }
                    else{
                        linea_cena[i][e] =  cena[i];
                    }

                }
            }
        }else{
            linea_cena = 0;
        }

        console.log("desayuno"+line_desayuno);
        console.log("comida"+line_comida);
        console.log("cena"+linea_cena);


        $.plot("#placeholder", [line_desayuno,line_comida,linea_cena]);



        //esto puede servir mas adelante
        var options = {
                series: {
                    lines: { show: true },
                    points: { show: true }

                },
                    xaxis: {
                            mode: "time",
                            timeformat: "%Y/%m/%d"
                            },

            };

            var d2 = [[0, 0], [1, 2],[2,1],[3,4]];

            var d1 = [];
                for (var i = 0; i < 14; i += 0.5) {
                    d1.push([i, Math.sin(i)]);
                }


          //  $.plot($("#placeholder"), [ [[0, 0], [1, 2],[2,1],[3,4]] ], options);



        //     var d1 = [];
        // for (var i = 0; i < 14; i += 0.5) {
        //     d1.push([i, Math.sin(i)]);
        // }

        // var d2 = [[0, 3], [4, 8], [8, 5], [9, 13]];

        // // A null signifies separate line segments

        // var d3 = [[0, 12], [7, 12], null, [7, 2.5], [12, 2.5]];

        // $.plot("#placeholder", [ d1, d2, d3 ]);


    }

    function poner_tip(){
            var output = [];
            db.transaction( function(tx) {
            tx.executeSql("SELECT * FROM tips", [],
                function(tx, result){
                    for(var i=0; i < result.rows.length; i++) {
                        output.push([result.rows.item(i)['id_tips'],
                                result.rows.item(i)['titulo'],
                                result.rows.item(i)['imagen'],
                                result.rows.item(i)['descripcion']]);
                    }
                      tip(output);
                });
        });

    }

    function tip(tips){
        console.log(tips);
        var html= " <h2>"       +tips[0][1]+ "</h2>" +
                  "  <img src='"+tips[0][2]+ "'/> " +
                  " <p> "       +tips[0][3]+ " </p>";
         $("#tip_pagina").html(html);
         location.href="index.html#tips";
    }



