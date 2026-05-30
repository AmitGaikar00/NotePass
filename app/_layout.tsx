import { MaterialIcons } from "@expo/vector-icons";
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
          headerStyle: { backgroundColor: "#ffffff" },
          headerTitleStyle: {
            fontWeight: "900",
            fontSize: 22,
            color: "#000000",
            marginLeft: 5,
          },
          drawerActiveTintColor: "#1a73e8",
          drawerActiveBackgroundColor: "#e8f0fe",
          drawerInactiveTintColor: "#5f6368",
          drawerStyle: { width: "70%", backgroundColor: "#ffffff" },
          drawerLabelStyle: {
            fontSize: 18,
            fontWeight: "bold",
            marginLeft: -10,
            paddingVertical: 5,
          },

          // FIX: Removed margins and border radius for a full-width background
          drawerItemStyle: {
            borderRadius: 0,
            marginHorizontal: 0,
            marginVertical: 0,
            paddingLeft: 0,
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: "Notes",
            drawerLabel: "Notes",
            drawerIcon: ({ color }) => (
              <MaterialIcons name="notes" size={24} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="passwords"
          options={{
            title: "Passwords",
            drawerLabel: "Passwords",
            drawerIcon: ({ color }) => (
              <MaterialIcons name="lock" size={24} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="trash"
          options={{
            title: "Trash",
            drawerLabel: "Trash",
            drawerIcon: ({ color }) => (
              <MaterialIcons name="delete" size={24} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
