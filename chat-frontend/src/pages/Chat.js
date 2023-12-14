import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import MessageForm from "../components/MessageForm";

function Chat() {
    return (
        <Container>
            <Row>
                <Col md={4} sm={4} style={{padding: '0px'}}>
                    <Sidebar />
                </Col>
                <Col md={8} sm={8} style={{"padding-right": "5px"}}>
                    <MessageForm />
                </Col>
            </Row>
        </Container>
    );
}

export default Chat;
