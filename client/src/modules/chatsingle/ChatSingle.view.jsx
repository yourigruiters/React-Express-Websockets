import React from "react";
import * as _ from "lodash";
import { withRouter } from "react-router-dom";
import "./ChatSingle.view.scss";
import Chat from "../../components/chat/Chat";
import {
	ChatLocked,
	ChatOpen,
	UserList,
	LeftArrow,
	Exit,
	BackArrow,
} from "../../icons/icons";

const ChatSingle = ({ socket, match, history }) => {
	const [messages, setMessages] = React.useState([]);
	const [isTyping, setIsTyping] = React.useState([]);
	const [users, setUsers] = React.useState([]);
	const [sendIsTyping, setSendIsTyping] = React.useState(false);
	const [chatInput, setChatInput] = React.useState("");
	const [toggleList, setToggleList] = React.useState(false);
	const [error, setError] = React.useState(false);
	const [password, setPassword] = React.useState(false);
	const [roomInfo, setRoomInfo] = React.useState([]);

	const roomName = match.params.roomName;

	React.useEffect(() => {
		socket.emit("joining_room", roomName);

		socket.on("room_not_found", () => {
			history.push("/dashboard/chats");
		});

		socket.on("room_data", (roomData) => {
			setIsTyping(roomData.isTyping);
			setUsers(roomData.users);

			const { title, privateroom, category, maxUsers } = roomData;
			setRoomInfo({
				title: title,
				private: privateroom,
				category: category,
				maxUsers: maxUsers,
			});
		});

		socket.on("changed_typing", (isTypingPeople) => {
			setIsTyping(isTypingPeople);
		});

		socket.on("message", (messageObject) => {
			const { user, type, message, chatColor } = messageObject;

			const today = new Date();
			let hour = today.getHours();
			hour = hour.toString().length === 2 ? hour : "0" + hour;
			let minutes = today.getMinutes();
			minutes = minutes.toString().length === 2 ? minutes : "0" + minutes;
			let seconds = today.getSeconds();
			seconds = seconds.toString().length === 2 ? seconds : "0" + seconds;
			const time = `${hour}:${minutes}:${seconds}`;

			setMessages((prevState) => {
				const newMessage = {
					name: user,
					timestamp: time,
					type,
					chatColor,
				};
				if (type === "joined" || type === "left") {
					newMessage.message = `has ${type} the chatroom`;
				} else if (type === "message") {
					newMessage.message = message;
				}

				return [...prevState, newMessage];
			});
		});

		socket.on("someone_left", (usersStillThere) => {
			setUsers(usersStillThere);
		});

		socket.on("leaving_room", () => {
			history.push("/dashboard/chats");
		});
	}, []);

	const sendChatMessage = (event) => {
		event.preventDefault();

		if (chatInput === "") {
			setError(true);
			return;
		} else {
			setError(false);
		}

		const message = {
			room: roomName,
			message: chatInput,
		};

		socket.emit("sending_message", message);

		handleChange("");
	};

	const handleChange = (value) => {
		if (value.length === 1 && !sendIsTyping) {
			setSendIsTyping(true);
			socket.emit("started_typing", roomName);
		} else if (value.length === 0 && sendIsTyping) {
			setSendIsTyping(false);
			socket.emit("stopped_typing", roomName);
		}

		setChatInput(value);
	};

	const leaveRoom = () => {
		socket.emit("leaving_room", roomName);
	};

	return (
		<section className="chatsingle">
			<section className="chatsection">
				<section className="chatsection__header">
					<section className="chatsection__header--start">
						<article
							className="chatsection__header--icon iconbutton"
							onClick={leaveRoom}
						>
							<BackArrow />
						</article>
						<h1 className="chatsection__header--title">{roomInfo.title}</h1>
					</section>

					<article className="chatsection__header--middle">
						<article
							className="iconbutton iconbutton--lock"
							onClick={() => {
								!password ? setPassword(true) : setPassword(false);
							}}
						>
							{roomInfo.privateroom ? <ChatLocked /> : <ChatOpen />}
						</article>
						<h4
							className={
								password && roomInfo.privateroom
									? "password password__active"
									: "password password__inactive"
							}
						>
							password
						</h4>
					</article>

					<section className="chatsection__header--end">
						<article className="buttons">
							<a
								className="buttons__toggle"
								onClick={() => {
									!toggleList ? setToggleList(true) : setToggleList(false);
								}}
							>
								<article className="iconbutton iconbutton--people">
									<UserList />
								</article>
								<h4 className="iconbutton--people--amount">
									{users.length}/{roomInfo.maxUsers}
								</h4>
								<article className="iconbutton iconbutton--people">
									<LeftArrow />
								</article>
							</a>
						</article>
					</section>
				</section>
				<Chat
					sendChatMessage={sendChatMessage}
					error={error}
					handleChange={handleChange}
					chatInput={chatInput}
					isTyping={isTyping}
					messages={messages}
				/>
			</section>

			<section
				className={
					toggleList
						? "usersection buttons__toggle--show"
						: "usersection buttons__toggle--hide"
				}
			>
				<section className="usersection__header">
					<a
						className="buttons__toggle--close"
						onClick={() => {
							!toggleList ? setToggleList(true) : setToggleList(false);
						}}
					>
						<article className="usersection__header--title iconbutton">
							<Exit />
						</article>
					</a>
				</section>
				<article className="usersection__content">
					{users.map((user, index) => (
						<article key={index} className="peoplelist">
							<img
								src={`https://www.countryflags.io/${user.countryCode}/flat/64.png`}
								className="peoplelist__flag"
							/>
							<p className="peoplelist__text">{user.name}</p>
						</article>
					))}
				</article>
			</section>
		</section>
	);
};

export default withRouter(ChatSingle);
