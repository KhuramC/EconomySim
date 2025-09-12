import React from 'react';
import { Box, Grid, Typography, Button } from '@mui/material';
import {Card, CardContent} from "@mui/material";

function SetupPage() {
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
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Middle Class</Typography>
                            <Typography variant='body2'>
                                Percentage of Pop: 55%, Avg Household Income: $80,000
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Lower Class</Typography>
                            <Typography variant='body2'>
                                Percentage of Pop: 40%, Avg Household Income: $30,000
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
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
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Housing</Typography>
                            <Typography variant='body2'>
                                Avg. Rent: $500 / month
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Groceries</Typography>
                            <Typography variant='body2'>
                                Avg. Price of Goods: $200
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Entertainment</Typography>
                            <Typography variant='body2'>
                                Avg. Price of Goods: $200
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Luxury Goods</Typography>
                            <Typography variant='body2'>
                                Avg. Price of Goods: $800
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Gas</Typography>
                            <Typography variant='body2'>
                                Avg. Price Per Gallon: $4.00
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
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
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Tariffs</Typography>
                            <Typography variant='body2'>
                                Current rate on imports: 5%
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2, flexGrow: 1  }}>
                        <CardContent>
                            <Typography variant='h6'>Subsidies</Typography>
                            <Typography variant='body2'>
                                Current Goods Subsidized: Electric cars, food stamps
                            </Typography>
                            <Button variant='outlined' size='small' sx={{ mt: 1 }}>...</Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Button variant="contained" color="primary" sx={{ mt: 4 }}>Begin Simulation</Button>
        </Box>
    );
}

export default SetupPage;