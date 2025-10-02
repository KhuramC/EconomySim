import react from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';

function TopicCard({ title, description, onEdit }) {
    return (
        <Card sx={{ mb: 2, flexGrow: 1}}>
            <CardContent>
                <Typography variant='h6'>{title}</Typography>
                <Typography variant='body2'>{description}</Typography>
                <Button variant='outlined' size='small' sx={{ mt: 1 }} onClick={() => onEdit(title)}>...</Button>
            </CardContent>
        </Card>
    );
}

export default TopicCard;