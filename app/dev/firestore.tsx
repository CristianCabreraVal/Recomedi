import { SafeAreaView } from "react-native-safe-area-context";
import { Text, StyleSheet } from "react-native";

export default function FirebaseDev(){

    return(

        <SafeAreaView style={styles.container}>

            <Text style={styles.title}>
                Firebase Test
            </Text>

        </SafeAreaView>

    );

}

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