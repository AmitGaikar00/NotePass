import { Drawer } from "expo-router/drawer";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerTitleAlign: "left",
          headerTintColor: "#000000",
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTitleStyle: {
            fontWeight: "900",
            fontSize: 22,
            color: "#000000",
            marginLeft: 0,
          },
          drawerActiveTintColor: "#1a73e8", // Blue text for active item
          drawerActiveBackgroundColor: "#e8f0fe", // Light powder blue background for active item
          drawerInactiveTintColor: "#5f6368",
          drawerStyle: {
            width: "70%",
            backgroundColor: "#ffffff",
          },
          drawerLabelStyle: {
            fontSize: 18,
            fontWeight: "bold",
            marginLeft: 10,
            paddingVertical: 5, // Moved padding to the label so the background box wraps it perfectly
          },
          drawerItemStyle: {
            borderRadius: 0, // Removes the round pill cuts
            marginHorizontal: 0, // Forces edge-to-edge width
            marginVertical: 0, // Removes gaps between options
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{ title: "Notes", drawerLabel: "Notes" }}
        />
        <Drawer.Screen
          name="passwords"
          options={{ title: "Passwords", drawerLabel: "Passwords" }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
