
// Componente para evitar que el contenido se solape con los bordes físicos del dispositivo (notch, barra de estado)
import { SafeAreaView } from "react-native-safe-area-context";
 // importa los componentes de React Native que se van a utilizar en la pantalla
import { Text, StyleSheet } from "react-native";
// export permite utilizar este componente desde otros archivos.
// function declara el componente.
// export default indica que este es el componente principal que se exporta desde este archivo.
export default function FirebaseDev(){
    return(

        <SafeAreaView style={styles.container}>

            <Text style={styles.title}>
                Firebase Test
            </Text>

        </SafeAreaView>

    );

}
/* StyleSheet.create permite agrupar los estilos utilizados por los componentes de este archivo.
 Cada propiedad dentro de styles representa un conjunto de 
 características visuales que puede aplicarse mediante:
 style={styles.nombre}
 */
const styles = StyleSheet.create({

container:{

flex:1,

justifyContent:"center",

alignItems:"center"

},

title:{

fontSize:30,

fontWeight:"bold"

}

});