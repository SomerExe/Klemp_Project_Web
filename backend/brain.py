import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import os

class PointNetEncoder(nn.Module):
    def __init__(self):
        super(PointNetEncoder, self).__init__()
        self.conv1 = nn.Conv1d(3, 64, 1); self.conv2 = nn.Conv1d(64, 128, 1); self.conv3 = nn.Conv1d(128, 1024, 1)
        self.bn1 = nn.BatchNorm1d(64); self.bn2 = nn.BatchNorm1d(128); self.bn3 = nn.BatchNorm1d(1024)

    def forward(self, x):
        x = F.relu(self.bn1(self.conv1(x))); x = F.relu(self.bn2(self.conv2(x))); x = F.relu(self.bn3(self.conv3(x)))
        x = torch.max(x, 2, keepdim=True)[0]
        return x.view(-1, 1024)

class KlempTahminNet(nn.Module):
    def __init__(self):
        super(KlempTahminNet, self).__init__()
        self.encoder = PointNetEncoder()
        self.fc1 = nn.Linear(1024 + 3, 512); self.fc2 = nn.Linear(512, 256); self.fc3 = nn.Linear(256, 9)

    def forward(self, pcd, weld):
        pcd_feat = self.encoder(pcd)
        combined = torch.cat((pcd_feat, weld), 1)
        x = F.relu(self.fc1(combined)); x = F.relu(self.fc2(x))
        return self.fc3(x).view(-1, 3, 3)

class EngineeringBrain:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = KlempTahminNet().to(self.device)
        model_path = os.path.join(os.path.dirname(__file__), "models", "arac_kapisi_klemp_model.pth")
        if os.path.exists(model_path):
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.eval()