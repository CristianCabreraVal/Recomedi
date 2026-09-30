/* 
importes que traen archivos o librerias para utilizar funciones, componentes y herramientas.
{} indica que elementos importan especificamente sea una funcion especifica de la libreria, como useRouter, useEffect.
 from indica de qué librería o archivo se obtiene cada elemento.
 */
// Href: tipo utilizado por Expo Router para representar una ruta.
// Link: componente que permite crear enlaces y navegar hacia otra ruta.
import {Href,Link} from "expo-router";
// openBrowserAsync: permite abrir una dirección web dentro de un navegador integrado en la aplicación. 
// WebBrowserPresentationStyle: proporciona las opciones para definir cómo se presenta visualmente ese navegador.
import {openBrowserAsync,WebBrowserPresentationStyle} from "expo-web-browser";
// ComponentProps: obtiene automáticamente las propiedades que acepta un componente existente de React.
import {type ComponentProps,} from "react";
// type permite crear un nuevo tipo de datos en TypeScript.
// Props describe las propiedades que puede recibir el componente ExternalLink.
// ComponentProps<typeof Link>: obtiene automáticamente todas las propiedades que acepta el componente Link.
// typeof Link: obtiene el tipo del componente Link para poder utilizarlo dentro de ComponentProps.
// Omit<..., "href">: toma todas esas propiedades, pero elimina href. Esto permite definir href nuevamente con el tipo que necesitemos para ExternalLink.
// &: combina dos tipos en uno.
// { href: Href & string }: vuelve a agregar la propiedad href y establece que debe ser compatible con una ruta de Expo Router y con un string.
type Props =
  Omit<
    ComponentProps<typeof Link>,
    "href"
  > & {
    href: Href & string;
  };
// export permite que ese componente sea utilizado por otros archivos por de medio imports.
// function declara una función. En React, una función como esta puede utilizarse como componente cuando devuelve elementos de interfaz.
// { href, ...rest }: obtiene href por separado y guarda el resto de propiedades dentro de rest.
export function ExternalLink({
  href,
  ...rest
}: Props) {
  /* return indica qué devuelve la función.
   En un componente React, normalmente return contiene el JSX que representa lo que aparecerá en pantalla.
   En este caso se devuelve un componente Link.
   */
  return (
    <Link
      // En la versión web indica que el enlace se abra en una nueva pestaña o ventana del navegador.
      target="_blank"
      // Pasa al Link todas las propiedades recibidas excepto href, que se define explícitamente debajo.
      {...rest}
      // Dirección que abrirá el enlace.
      href={href}
      // onPress se ejecuta cuando el usuario pulsa el enlace.
      // async permite utilizar await dentro de esta función.
      onPress={async (event) => {
        //Comprueba si la aplicación no se ejecuta en la plataforma web.
        // Esto permite utilizar un comportamiento diferente en dispositivos móviles.
        if (
          process.env.EXPO_OS !== "web"
        ) {
          // Evita que un link se abra directamente el navegador externo por su comportamiento predeterminado.
          event.preventDefault();
           //Abre la dirección en un navegador integrado dentro de la aplicación.
          await openBrowserAsync(
            href,
            {
              //AUTOMATIC permite que la plataforma decida la forma adecuada de presentar el navegador.
              presentationStyle:
                WebBrowserPresentationStyle.AUTOMATIC,
            }
          );
        }
      }}
    />
  );
}