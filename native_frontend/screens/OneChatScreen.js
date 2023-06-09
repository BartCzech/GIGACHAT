import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  Center,
  Heading,
  Box,
  Button,
  Spinner,
  Input,
  useToast,
  Avatar,
} from "native-base";
import { useEffect, useState } from "react";
import { getSender } from "../config/ChatLogics";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import ScrollableChat from "./ScrollableChat";
import Icon from "react-native-vector-icons/Ionicons";
import io from "socket.io-client";
import { BlurView } from "expo-blur";
import { RollInLeft } from "react-native-reanimated";

// const ENDPOINT = "http://192.168.43.229:5000";
const ENDPOINT = "https://nine82hwf9h9398fnfy329y2n92y239cf.onrender.com/";
let socket, selectedChatCompare;

export default OneChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState();
  const [socketConnected, setSocketConnected] = useState(false);

  const [selectedChat, setSelectedChat] = useState();
  const [loggedUserId, setLoggedUserId] = useState();
  const [username, setUsername] = useState();
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  let token = "";

  const toast = useToast();

  const fetchMessages = async () => {
    if (!selectedChat) return;

    token = await AsyncStorage.getItem("LoggedUserToken");

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    setLoading(true);

    const { data } = await axios.get(
      `https://nine82hwf9h9398fnfy329y2n92y239cf.onrender.com/api/message/${
        JSON.parse(selectedChat)._id
      }`,
      config
    );

    setMessages(data);
    setLoading(false);

    socket.emit("join chat", JSON.parse(selectedChat)._id);
    try {
    } catch (error) {
      toast.show({
        description: error.message,
      });
    }
  };

  useEffect(() => {
    async function setupSocket() {
      socket = io(ENDPOINT);
      socket.emit("setup", await AsyncStorage.getItem("LoggedUserId"));
      socket.on("connected", () => setSocketConnected(true));
      socket.on("typing", () => setIsTyping(true));
      socket.on("stop typing", () => setIsTyping(false));
    }
    setupSocket();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoggedUserId(await AsyncStorage.getItem("LoggedUserId"));
      setSelectedChat(await AsyncStorage.getItem("selectedChat"));
      setUsername(getSender(loggedUserId, JSON.parse(selectedChat).users));
      // console.log(username.charAt(0));
      selectedChatCompare = JSON.parse(
        await AsyncStorage.getItem("selectedChat")
      );
      await fetchMessages();
    }
    fetchData();
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        //give notification
      } else {
        setMessages([...messages, newMessageReceived]);
      }
    });
  });

  // console.log(messages);
  // console.log(loggedUserId);

  const sendMessage = async () => {
    token = await AsyncStorage.getItem("LoggedUserToken");
    if (newMessage) {
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        setNewMessage("");
        const { data } = await axios.post(
          `https://nine82hwf9h9398fnfy329y2n92y239cf.onrender.com/api/message`,
          {
            content: newMessage,
            chatId: JSON.parse(selectedChat)._id,
          },
          config
        );

        // console.log(data);

        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast.show({
          description: error.message,
        });
      }
    }
  };

  const typingHandler = (value) => {
    setNewMessage(value);

    // Typing Indicator Logic
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      console.log("typing now");
      socket.emit("typing", JSON.parse(selectedChat)._id);
    }
    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;
    setTimeout(async () => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;

      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", JSON.parse(selectedChat)._id);
        console.log(JSON.parse(selectedChat)._id);
        console.log("stopping typing now");

        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <SafeAreaView>
      <View
        height="15%"
        mx={7}
        display="flex"
        flexDir="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <View
         display="flex"
         flexDir="row"
         alignItems="center"
        >
        <Avatar size="md" bg="black">
          {username ? username.charAt(0) : 'x'}
        </Avatar>
        <View marginLeft={2} display="flex" flexDir="column">
          <Heading fontSize={30}>{selectedChat ? username : <></>}</Heading>
          {isTyping ? (
            <View position="relative">
              <Text>typing...</Text>
            </View>
          ) : (
            <></>
          )}
        </View>
        </View>
        <Button
              zIndex="0"
              bg="transparent"
              onPress={() => {
                navigation.goBack();
              }}
              left={"20px"}
        >

                <Icon name="close" size={55} />
        </Button>
      </View>
      <View
        display="flex"
        flexDirection="column"
        justifyContent="flex-end"
        width="100%"
        height="77%"
        borderTopLeftRadius="50"
        borderTopRightRadius="50"
        overflow="hidden"
      >
        <BlurView height="100%" intensity={20} tint="dark" overflow="hidden">
          {loading ? (
            <Spinner
              size={60}
              color="black"
              alignSelf="center"
              marginTop={20}
            />
          ) : (
            <View
              display="flex"
              flexDirection="column"
              height="100%"
              borderTopLeftRadius="50"
              borderTopRightRadius="50"
              overflow="hidden"
              paddingBottom={5}
              paddingRight={3}
            >
              <ScrollableChat
                messages={messages}
                loggedUserId={loggedUserId}
                username={username}
              />
            </View>
          )}
        </BlurView>
      </View>
      <BlurView height="8%" intensity={20} tint="dark" overflow="hidden">
        <Input
          isRequired
          mx={3}
          placeholder="Type a message..."
          borderColor="black"
          placeholderTextColor="black"
          borderRadius={15}
          onChangeText={(value) => typingHandler(value)}
          value={newMessage}
          InputRightElement={
            <Button
              backgroundColor="black"
              size="xs"
              rounded="none"
              w="1/6"
              height="full"
              onPress={sendMessage}
            >
              <Icon name="send" size={20} color="white" />
            </Button>
          }
        />
      </BlurView>
    </SafeAreaView>
  );
};
