import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const updates = req.body; // Array of { id, displayOrder }
        const filePath = path.join(process.cwd(), 'data', 'products.json');
        const fileData = fs.readFileSync(filePath, 'utf8');
        let products = JSON.parse(fileData);

        // Update displayOrder for each product
        products = products.map(product => {
            const update = updates.find(u => u.id === product.id);
            if (update) {
                return { ...product, displayOrder: update.displayOrder };
            }
            return product;
        });

        // Sort by displayOrder to keep the file organized (optional but good)
        products.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
        res.status(200).json({ message: 'Order updated successfully', products });
    } catch (error) {
        console.error('Failed to reorder products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
