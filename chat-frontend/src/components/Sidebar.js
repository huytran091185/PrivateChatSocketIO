import React, { useContext, useEffect, useState} from "react"; 
import { Col, ListGroup, Row, Form } from "react-bootstrap"; 
import { useDispatch, useSelector } from "react-redux";
import { AppContext } from "../context/appContext";
import { addNotifications, resetNotifications } from "../features/userSlice";
import "./Sidebar.css";
import user_icon from "../assets/user.jpg";
function Sidebar() {
    const [keyword, setKeyword] = useState("");
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const { socket, setMembers, members, setCurrentRoom, setRooms, privateMemberMsg, rooms, setPrivateMemberMsg, currentRoom } = useContext(AppContext);

    function joinRoom(room, isPublic = true) {
        if (!user) {
            return alert("Please login");
        }
        socket.emit("join-room", room, currentRoom);
        setCurrentRoom(room);

        if (isPublic) {
            setPrivateMemberMsg(null);
        }
        // dispatch for notifications
        dispatch(resetNotifications(room));
    }

    socket.off("notifications").on("notifications", (room) => {
        if (currentRoom != room) dispatch(addNotifications(room));
    });

    useEffect(() => {
        if (user) {
            console.log("members",members);
           setCurrentRoom("Nội bộ"); 
            getRooms();
            socket.emit("join-room", "Nội bộ");
            socket.emit("new-user",user.email);
        }
    }, []);

    socket.off("new-user").on("new-user", (payload) => {
        setMembers(payload);
    });

    function getRooms() {
        fetch("http://localhost:5001/rooms")
            .then((res) => res.json())
            .then((data) => setRooms(data));
    }

    function orderIds(id1, id2) {
        if (id1 > id2) {
            return id1 + "-" + id2;
        } else {
            return id2 + "-" + id1;
        }
    }

    function handlePrivateMemberMsg(member) {
        setPrivateMemberMsg(member);
        const roomId = orderIds(user._id, member._id);
        joinRoom(roomId, false);
    }

    if (!user) {
        return <></>;
    }
    return (
        <>
           
            <ListGroup>
                {rooms.map((room, idx) => (
                    <ListGroup.Item key={idx} onClick={() => joinRoom(room)} active={room == currentRoom} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                        {room} {currentRoom !== room && <span className="badge rounded-pill bg-primary">{user.newMessages[room]}</span>}
                    </ListGroup.Item>
                ))}
            </ListGroup>
        <hr style={{margin: "10px 0px"}} />
            <div><Form.Group style={{"margin-bottom": "5px !important"}} className="mb-3" controlId="formSearch"> 
                            <Form.Control type="text" placeholder="Tìm kiếm" onChange={(e) => setKeyword(e.target.value)}  value={keyword} />
                        </Form.Group></div>
            { (keyword?members.filter(x  => x.name.includes(keyword)&&x._id!=user?._id) : members).map((member) => (
                <ListGroup.Item hidden={member._id === user?._id} key={member.id} style={{ cursor: "pointer", padding:'5px' }} active={privateMemberMsg?._id == member?._id} onClick={() => handlePrivateMemberMsg(member)} disabled={member._id === user._id}>
                    <Row>
                        <Col xs={2} className="member-status">
                            <img src={member.picture?member.picture:user_icon} className="member-status-img" />
                            {member.status == "online" ? <i className="fas fa-circle sidebar-online-status"></i> : <i className="fas fa-circle sidebar-offline-status"></i>}
                        </Col>
                        <Col xs={9} style={{"margin-left": "5px"}}>
                            {member.name}  
                            {member._id === user?._id && " (You)"}
                            {member.status == "offline" && " (Offline)"}
                        </Col>
                        <Col xs={1}>
                            <span className="badge rounded-pill bg-primary">{user.newMessages[orderIds(member._id, user._id)]}</span>
                        </Col>
                    </Row>
                </ListGroup.Item>
            ))}
        </>
    );
}

export default Sidebar;
