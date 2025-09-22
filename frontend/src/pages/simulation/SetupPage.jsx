import React, { useState } from 'react';
import { Box, Grid, Typography, Button, Card, CardContent, Modal } from '@mui/material';
import TopicCard from '../../components/TopicCard';
import PageTitle from "../../components/PageTitle";

function SetupPage({ onSetupComplete }) {
    // Parameter popups
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);

    const handleOpenModal = (topic) => {
        setEditingTopic(topic);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTopic(null);
    };

    console.log("Current topic to edit:", editingTopic);

    // Simulation settings state
    const [config, setConfig] = useState({
        demographics: { },
        industries: { },
        policies: { }
    });

    const handleBeginClick = () => {
        // When user clicks the button, call the function from the parent
        // and pass collected config data
        onSetupComplete(config);
    };

    return (
        // Container with padding
        <Box sx={{ p: 3}}>
            <PageTitle text="Simulation Set-Up" />

            {/* Handles overall layout */}
            <Grid container spacing={3} sx={{ display: 'flex' }}>

                {/* Defines a single column */}
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='h5'>Demographics</Typography>

                    <TopicCard
                        title="Upper Class"
                        description="Percentage of Pop: 5%, Avg Household Income: $500,000"
                        onEdit={handleOpenModal}
                    />

                    <TopicCard
                        title="Middle Class"
                        description="Percentage of Pop: 55%, Avg Household Income: $80,000"
                        onEdit={handleOpenModal}
                    />

                    <TopicCard
                        title="Lower Class"
                        description="Percentage of Pop: 40%, Avg Household Income: $30,000"
                        onEdit={handleOpenModal}
                    />                  
                </Grid>

                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5">Industries</Typography>

                    <TopicCard
                        title="Utilities"
                        description="Avg. Price of Electricity: $200 / kwH"
                        onEdit={handleOpenModal}
                    />

                    <TopicCard
                        title="Housing"
                        description="Avg. Rent: $500 / month"
                        onEdit={handleOpenModal}
                    />

                    <TopicCard
                        title="Groceries"
                        description="Avg. Price of Goods: $200"
                        onEdit={handleOpenModal}
                    />  

                    <TopicCard
                        title="Entertainment"
                        description="Avg. Price of Goods: $200"
                        onEdit={handleOpenModal}
                    />

                    <TopicCard
                        title="Luxury Goods"
                        description="Avg. Price of Goods: $800"
                        onEdit={handleOpenModal}
                    />

                    <TopicCard
                        title="Gas"
                        description="Avg. Price Per Gallon: $4.00"
                        onEdit={handleOpenModal}
                    /> 
                </Grid>

                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5">Policies</Typography>

                    <TopicCard
                        title="Taxes"
                        description="Tax Structure: Progressive Tax"
                        onEdit={handleOpenModal}
                    />

                    <TopicCard
                        title="Tariffs"
                        description="Current rate on imports: 5%"
                        onEdit={handleOpenModal}
                    />

                    <TopicCard
                        title="Subsidies"
                        description="Current Goods Subsidized: Electric cars, food stamps"
                        onEdit={handleOpenModal}
                    /> 
                </Grid>
            </Grid>


            {/* Modal (popup) for ediiting simulation configuration by topic. */}
            <Modal open={isModalOpen} onClose={handleCloseModal} aria-labelledby="modal-title">
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography id="modal-title" variant="h6" component="h2" >Editing {editingTopic}</Typography>

                    {renderModalContent(editingTopic)}

                    <Button onClick={handleCloseModal} sx={{ mt: 2 }}>Save and Close</Button>
                </Box>
            </Modal>


            <Button variant="contained" color="primary" sx={{ mt: 4 }} onClick={handleBeginClick}>Begin Simulation</Button>
        </Box>
    );
}

const renderModalContent = (topic) => {
    switch (topic) {
        case 'Upper Class':
        case 'Middle Class':
        case 'Lower Class':
            return (
                <Box>
                    <Typography >Adjust Demographics:</Typography>
                    {/* Add sliders and input fields for demographics here */}
                </Box>
            );
        case 'Utilities':
        case 'Housing':
        case 'Entertainment':
        case 'Groceries':
        case 'Luxury Goods':
        case 'Gas':
        case 'Taxes':
        case 'Tariffs':
        case 'Subsidies':
        default:
            return <Typography>No settings available for this topic.</Typography>;
    }
};

export default SetupPage;