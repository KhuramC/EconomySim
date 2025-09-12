import React, { useState } from 'react';
import { Box, Grid, Typography, Button, Card, CardContent, Modal } from '@mui/material';

function SetupPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);

    const handleOpenModal = (topic) => {
        setEditingTopic(topic);
        setIsModalOpen(true);
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTopic(null);
    };


    console.log("Current topic to edit:", editingTopic);

    return (
        // Container with padding
        <Box sx={{ p: 3}}>
            <Typography variant="h4" gutterBottom mt={4}>
                Setup Your Simulation
            </Typography>

            {/* Handles overall layout */}
            <Grid container spacing={3} sx={{ display: 'flex' }}>

                {/* Defines a single column */}
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='h5'>Demographics</Typography>

                    {/* Example card (topic of setup parameters) */}
                    <Card sx={{ mb: 2, flexGrow: 1 }}>
                        <CardContent>
                            <Typography variant='h6'>Upper Class</Typography>
                            <Typography variant='body2'>
                                Percentage of Pop: 5%, Avg Household Income: $500,000
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Upper Class')}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Middle Class</Typography>
                            <Typography variant='body2'>
                                Percentage of Pop: 55%, Avg Household Income: $80,000
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Middle Class')}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Lower Class</Typography>
                            <Typography variant='body2'>
                                Percentage of Pop: 40%, Avg Household Income: $30,000
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Lower Class')}>...</Button>
                        </CardContent>
                    </Card>                    
                </Grid>

                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5">Industries</Typography>

                    {/* Example card (topic of setup parameters) */}
                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Utilities</Typography>
                            <Typography variant='body2'>
                                Avg. Price of Electricity: $200 / kwH
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Utilities')}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Housing</Typography>
                            <Typography variant='body2'>
                                Avg. Rent: $500 / month
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Housing')}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Groceries</Typography>
                            <Typography variant='body2'>
                                Avg. Price of Goods: $200
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Groceries')}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Entertainment</Typography>
                            <Typography variant='body2'>
                                Avg. Price of Goods: $200
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Entertainment')}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Luxury Goods</Typography>
                            <Typography variant='body2'>
                                Avg. Price of Goods: $800
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Luxury Goods')}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Gas</Typography>
                            <Typography variant='body2'>
                                Avg. Price Per Gallon: $4.00
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Gas')}>...</Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5">Policies</Typography>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Taxes</Typography>
                            <Typography variant='body2'>
                                Tax Structure: Progressive Tax
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Taxes')}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Tariffs</Typography>
                            <Typography variant='body2'>
                                Current rate on imports: 5%
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Tariffs')}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Subsidies</Typography>
                            <Typography variant='body2'>
                                Current Goods Subsidized: Electric cars, food stamps
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => handleOpenModal('Subsidies')}>...</Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

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
                    <Typography id="modal-title" variant="h6" component="h2" sx={{ color: 'black' }}>Editing {editingTopic}</Typography>

                    {renderModalContent(editingTopic)}

                    <Button onClick={handleCloseModal} sx={{ mt: 2 }}>Save and Close</Button>
                </Box>
            </Modal>

            <Button variant="contained" color="primary" sx={{ mt: 4 }}>Begin Simulation</Button>
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
                    <Typography sx={{ color: 'black' }}>Adjust Demographics:</Typography>
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